import "server-only"
import { randomBytes } from "node:crypto"
import { db } from "./db"
import { rankOf } from "./ranking"
import { getSettings } from "./settings"

export class OrderError extends Error {
  constructor(public code: "not_found" | "amount_mismatch" | "not_refundable" | "university_unavailable") {
    super(code)
  }
}

// No 0/O/1/I/L: the id is read aloud and retyped when someone asks support
// about a payment.
const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
export function newPublicId() {
  const bytes = randomBytes(10)
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("")
}

export async function createOrder(input: {
  universityId: string
  power: number
  displayName?: string | null
  message?: string | null
  locale: string
  provider: string
}) {
  const settings = await getSettings()
  const university = await db.university.findFirst({
    where: { id: input.universityId, hidden: false },
    select: { id: true },
  })
  if (!university) throw new OrderError("university_unavailable")

  return db.order.create({
    data: {
      publicId: newPublicId(),
      universityId: university.id,
      power: input.power,
      unitPriceUzs: settings.unitPriceUzs,
      amountUzs: input.power * settings.unitPriceUzs,
      displayName: input.displayName || null,
      message: input.message || null,
      locale: input.locale,
      provider: input.provider,
      expiresAt: new Date(Date.now() + settings.orderTtlMinutes * 60_000),
    },
  })
}

/**
 * Credit a paid order. The single place POWER is ever added.
 *
 * Safe to call any number of times for the same order — providers retry
 * callbacks, and users reload return pages. The order row is locked first, so
 * two concurrent callbacks serialise and the second one sees PAID and leaves.
 */
export async function settleOrder(args: { publicId: string; providerRef: string; amountUzs: number }) {
  return db.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Order" WHERE "publicId" = ${args.publicId} FOR UPDATE`
    if (!locked) throw new OrderError("not_found")

    const order = await tx.order.findUniqueOrThrow({ where: { id: locked.id } })
    if (order.status === "PAID" || order.status === "REFUNDED") return order
    // A provider reporting a different sum than we asked for is never credited.
    if (order.amountUzs !== args.amountUzs) throw new OrderError("amount_mismatch")

    // Ranks are read under a lock on every university row that could move,
    // otherwise two settlements at once would each report stale positions.
    await tx.$queryRaw`SELECT id FROM "University" ORDER BY id FOR UPDATE`
    const before = await tx.university.findUniqueOrThrow({ where: { id: order.universityId } })
    // Universities still at 0 POWER are only listed, not yet ranked against
    // each other, so a first payment counts as starting just below everyone who
    // has POWER — not from an arbitrary spot in the list ("climbed 39 places").
    const rankBefore =
      before.power > 0
        ? await rankOf(before, tx)
        : (await tx.university.count({ where: { hidden: false, power: { gt: 0 } } })) + 1

    const after = await tx.university.update({
      where: { id: before.id },
      data: { power: { increment: order.power } },
    })
    const rankAfter = await rankOf(after, tx)

    // Feed entries for one payment share a moment; the millisecond offsets fix
    // their reading order (newest first): the POWER, the climb, then who fell.
    const at = Date.now()
    await tx.event.create({
      data: { type: "POWER", universityId: after.id, amount: order.power, orderId: order.id, createdAt: new Date(at + 2) },
    })
    if (!after.hidden && rankAfter < rankBefore) {
      await tx.event.create({
        data: { type: "RANK_UP", universityId: after.id, amount: rankBefore - rankAfter, orderId: order.id, createdAt: new Date(at + 1) },
      })
      // Everyone between the two positions was pushed down exactly one place.
      // Only those who had earned a position (POWER > 0) are reported, and at
      // most three, so one big jump cannot flood the feed.
      const overtaken = await tx.university.findMany({
        where: { hidden: false, id: { not: after.id } },
        orderBy: [{ power: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        skip: rankAfter - 1,
        take: rankBefore - rankAfter,
        select: { id: true, power: true },
      })
      await tx.event.createMany({
        data: overtaken.filter((u) => u.power > 0).slice(0, 3).map((u) => ({
          type: "RANK_DOWN" as const, universityId: u.id, amount: 1, orderId: order.id, createdAt: new Date(at),
        })),
      })
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID", paidAt: new Date(), providerRef: args.providerRef, rankBefore, rankAfter,
      },
    })
  })
}

/** Mark an unpaid order as failed/declined. Never downgrades a paid order. */
export async function failOrder(publicId: string) {
  await db.order.updateMany({ where: { publicId, status: "PENDING" }, data: { status: "FAILED" } })
}

/** Take POWER back. Used by admins after returning the money out of band. */
export async function refundOrder(publicId: string) {
  return db.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Order" WHERE "publicId" = ${publicId} FOR UPDATE`
    if (!locked) throw new OrderError("not_found")
    const order = await tx.order.findUniqueOrThrow({ where: { id: locked.id } })
    if (order.status !== "PAID") throw new OrderError("not_refundable")

    await tx.university.update({
      where: { id: order.universityId },
      data: { power: { decrement: order.power } },
    })
    await tx.event.deleteMany({ where: { orderId: order.id } })
    return tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED", refundedAt: new Date() },
    })
  })
}

/** Pending orders past their deadline can no longer be paid. */
export async function expireStaleOrders() {
  await db.order.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  })
}
