import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { PaymentProvider } from "."

/**
 * Sandbox provider. It behaves like a hosted payment page — the supporter is
 * redirected away, approves or declines, and the "gateway" reports back with
 * a signed callback — so the whole order lifecycle is exercised without money
 * moving. It only exists while PAYMENT_PROVIDER=test.
 */
export const testGateway: PaymentProvider = {
  name: "test",
  checkoutUrl: (order) => `/pay/test/${order.publicId}`,
}

export function testGatewayEnabled() {
  return (process.env.PAYMENT_PROVIDER ?? "test") === "test"
}

function secret() {
  const s = process.env.TEST_GATEWAY_SECRET
  if (!s) throw new Error("TEST_GATEWAY_SECRET is not set")
  return s
}

export function signCallback(publicId: string, outcome: "paid" | "declined", amountUzs: number) {
  return createHmac("sha256", secret()).update(`${publicId}.${outcome}.${amountUzs}`).digest("hex")
}

export function verifyCallback(publicId: string, outcome: "paid" | "declined", amountUzs: number, signature: string) {
  const expected = Buffer.from(signCallback(publicId, outcome, amountUzs))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
