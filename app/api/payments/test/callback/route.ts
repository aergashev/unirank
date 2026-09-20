import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { failOrder, settleOrder } from "@/lib/orders"
import { testGatewayEnabled, verifyCallback } from "@/lib/payments/test-gateway"

/**
 * The sandbox gateway reporting an outcome. A real provider's route has the
 * same three duties: verify the signature, settle or fail the order, send the
 * supporter back to their receipt.
 */
export async function POST(request: Request) {
  if (!testGatewayEnabled()) return new Response("Not found", { status: 404 })

  const form = await request.formData()
  const publicId = String(form.get("order") ?? "")
  const outcome = form.get("outcome") === "paid" ? "paid" : "declined"
  const amountUzs = Number(form.get("amount"))
  const signature = String(form.get(outcome === "paid" ? "sigPaid" : "sigDeclined") ?? "")

  if (!Number.isInteger(amountUzs) || !verifyCallback(publicId, outcome, amountUzs, signature))
    return new Response("Bad signature", { status: 400 })

  const order = await db.order.findUnique({ where: { publicId }, select: { locale: true, status: true, expiresAt: true } })
  if (!order) return new Response("Unknown order", { status: 404 })

  if (outcome === "paid" && order.status === "PENDING" && order.expiresAt > new Date())
    await settleOrder({ publicId, providerRef: `test_${publicId}`, amountUzs })
  else if (outcome === "declined") await failOrder(publicId)

  // 303 so the browser follows with GET and a reload never re-posts.
  return NextResponse.redirect(new URL(`/${order.locale}/orders/${publicId}`, request.url), 303)
}
