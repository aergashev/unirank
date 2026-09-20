import "server-only"
import { db } from "./db"

const DAY = 24 * 60 * 60 * 1000

function paidSince(since?: Date) {
  return db.order.aggregate({
    where: { status: "PAID", ...(since ? { paidAt: { gte: since } } : {}) },
    _sum: { amountUzs: true, power: true },
    _count: true,
  })
}

export async function getOverview() {
  const now = Date.now()
  const [day, week, all, pendingOrders, pendingSuggestions, latest] = await Promise.all([
    paidSince(new Date(now - DAY)),
    paidSince(new Date(now - 7 * DAY)),
    paidSince(),
    db.order.count({ where: { status: "PENDING" } }),
    db.suggestion.count({ where: { status: "PENDING" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { university: { select: { shortName: true } } } }),
  ])
  return {
    periods: [{ label: "Last 24 hours", v: day }, { label: "Last 7 days", v: week }, { label: "All time", v: all }],
    pendingOrders, pendingSuggestions, latest,
  }
}
