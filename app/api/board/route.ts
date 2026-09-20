import { getHomeData } from "@/lib/home-data"

export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json(await getHomeData(), { headers: { "Cache-Control": "no-store" } })
}
