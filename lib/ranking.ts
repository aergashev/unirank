import "server-only"
import { db } from "./db"
import type { Prisma } from "@/generated/prisma"

type Tx = Prisma.TransactionClient

/**
 * Board order: most POWER first; ties go to whoever was listed first, so a
 * tie never reshuffles on its own.
 */
export const BOARD_ORDER = [{ power: "desc" }, { createdAt: "asc" }, { id: "asc" }] as const

/** 1-based rank of a university among visible ones. */
export async function rankOf(
  u: { id: string; power: number; createdAt: Date },
  tx: Tx = db,
): Promise<number> {
  const ahead = await tx.university.count({
    where: {
      hidden: false,
      OR: [
        { power: { gt: u.power } },
        { power: u.power, createdAt: { lt: u.createdAt } },
        { power: u.power, createdAt: u.createdAt, id: { lt: u.id } },
      ],
    },
  })
  return ahead + 1
}

export type BoardRow = {
  id: string
  slug: string
  shortName: string
  nameUz: string
  nameRu: string
  nameEn: string
  region: string
  type: string
  logoPath: string | null
  power: number
  rank: number
}

export async function getBoard(): Promise<BoardRow[]> {
  const rows = await db.university.findMany({
    where: { hidden: false },
    orderBy: [...BOARD_ORDER],
    select: {
      id: true, slug: true, shortName: true, nameUz: true, nameRu: true, nameEn: true,
      region: true, type: true, logoPath: true, power: true,
    },
  })
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

export async function getStats() {
  const [universities, paid] = await Promise.all([
    db.university.count({ where: { hidden: false } }),
    db.order.aggregate({
      where: { status: "PAID" },
      _sum: { power: true, amountUzs: true },
      _count: true,
    }),
  ])
  return {
    universities,
    power: paid._sum.power ?? 0,
    amountUzs: paid._sum.amountUzs ?? 0,
    supporters: paid._count,
  }
}

/** The university that gained the most POWER in the last 24 hours, if any. */
export async function getTopGainer() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [top] = await db.order.groupBy({
    by: ["universityId"],
    where: { status: "PAID", paidAt: { gte: since }, university: { hidden: false } },
    _sum: { power: true },
    orderBy: { _sum: { power: "desc" } },
    take: 1,
  })
  if (!top?._sum.power) return null
  const university = await db.university.findUnique({
    where: { id: top.universityId },
    select: { slug: true, shortName: true, logoPath: true },
  })
  return university ? { ...university, gained: top._sum.power } : null
}

export async function getFeed(take = 8, universityId?: string) {
  const events = await db.event.findMany({
    where: { university: { hidden: false }, ...(universityId ? { universityId } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, type: true, amount: true, createdAt: true, orderId: true,
      university: { select: { slug: true, shortName: true } },
    },
  })
  // Names live on the order so that muting an order also cleans the feed.
  const orderIds = events.flatMap((e) => (e.orderId ? [e.orderId] : []))
  const orders = orderIds.length
    ? await db.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, displayName: true, muted: true },
      })
    : []
  const names = new Map(orders.map((o) => [o.id, o.muted ? null : o.displayName]))
  return events.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    at: e.createdAt.toISOString(),
    slug: e.university.slug,
    shortName: e.university.shortName,
    by: e.type === "POWER" && e.orderId ? (names.get(e.orderId) ?? null) : null,
  }))
}

export type FeedItem = Awaited<ReturnType<typeof getFeed>>[number]
