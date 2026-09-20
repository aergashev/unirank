import { z } from "zod"
import { hasLocale } from "@/lib/i18n"
import { OrderError, createOrder } from "@/lib/orders"
import { getProvider } from "@/lib/payments"
import { allow, clientIp } from "@/lib/rate-limit"
import { getSettings } from "@/lib/settings"

// Collapse whitespace and strip control characters; names and messages are
// shown publicly, so they are kept to plain single-line text.
const clean = (max: number) =>
  z.string().transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max))

const Body = z.object({
  universityId: z.string().min(1),
  power: z.number().int().min(1),
  displayName: clean(40).optional(),
  message: clean(140).optional(),
  locale: z.string(),
})

export async function POST(request: Request) {
  if (!allow(`order:${clientIp(request.headers)}`, 12, 60_000))
    return Response.json({ error: "rate" }, { status: 429 })

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "amount" }, { status: 400 })

  const { maxPowerPerOrder } = await getSettings()
  if (parsed.data.power > maxPowerPerOrder) return Response.json({ error: "amount" }, { status: 400 })

  try {
    const provider = getProvider()
    const order = await createOrder({
      ...parsed.data,
      locale: hasLocale(parsed.data.locale) ? parsed.data.locale : "uz",
      provider: provider.name,
    })
    return Response.json({ url: provider.checkoutUrl(order) })
  } catch (e) {
    if (e instanceof OrderError && e.code === "university_unavailable")
      return Response.json({ error: "unavailable" }, { status: 409 })
    console.error("order create failed", e)
    return Response.json({ error: "generic" }, { status: 500 })
  }
}
