import "server-only"
import { expireStaleOrders } from "./orders"
import { getBoard, getFeed, getStats, getTopGainer } from "./ranking"

/** Everything the home page shows, in one shape, for both SSR and polling. */
export async function getHomeData() {
  await expireStaleOrders()
  const [rows, stats, feed, gainer] = await Promise.all([getBoard(), getStats(), getFeed(), getTopGainer()])
  return { rows, stats, feed, gainer }
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>
