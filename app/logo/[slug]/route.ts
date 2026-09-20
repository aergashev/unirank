import { db } from "@/lib/db"

export async function GET(_: Request, { params }: RouteContext<"/logo/[slug]">) {
  const { slug } = await params
  const logo = await db.logo.findFirst({ where: { university: { slug } } })
  if (!logo) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mime,
      // The URL carries ?v=<version>, so a given URL never changes content.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
