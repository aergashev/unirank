import "server-only"
import { db } from "./db"
import { getBoard } from "./ranking"

const DAY = 24 * 60 * 60 * 1000
// Days are cut at Tashkent midnight (UTC+5, no DST), not the server's.
const TZ_OFFSET = 5 * 60 * 60 * 1000

export async function getUniversityPage(slug: string) {
  const board = await getBoard()
  const row = board.find((r) => r.slug === slug)
  if (!row) return null

  const today = Math.floor((Date.now() + TZ_OFFSET) / DAY)
  const since = new Date((today - 29) * DAY - TZ_OFFSET)
  const [uni, recent, paid, count] = await Promise.all([
    db.university.findUniqueOrThrow({ where: { id: row.id }, select: { domain: true } }),
    db.order.findMany({
      where: { universityId: row.id, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 12,
      select: { id: true, power: true, displayName: true, message: true, muted: true, paidAt: true },
    }),
    db.order.findMany({
      where: { universityId: row.id, status: "PAID", paidAt: { gte: since } },
      select: { power: true, paidAt: true },
    }),
    db.order.count({ where: { universityId: row.id, status: "PAID" } }),
  ])

  const perDay = new Map<number, number>()
  for (const o of paid) {
    const day = Math.floor((o.paidAt!.getTime() + TZ_OFFSET) / DAY)
    perDay.set(day, (perDay.get(day) ?? 0) + o.power)
  }
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = today - 29 + i
    return { date: new Date(day * DAY - TZ_OFFSET + DAY / 2), power: perDay.get(day) ?? 0 }
  })

  return {
    row,
    domain: uni.domain,
    ahead: board.slice(0, row.rank - 1),
    neighbours: board.slice(Math.max(0, row.rank - 2), row.rank + 1),
    supporters: count,
    days,
    recent: recent.map((o) => ({
      id: o.id,
      power: o.power,
      name: o.muted ? null : o.displayName,
      message: o.muted ? null : o.message,
      at: o.paidAt!.toISOString(),
    })),
  }
}
