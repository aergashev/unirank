import "server-only"
import type { Order } from "@/generated/prisma"
import { testGateway } from "./test-gateway"

/**
 * What the rest of the app knows about a payment provider: where to send the
 * supporter to pay. Settlement arrives separately, through the provider's own
 * callback route under app/api/payments/<name>/, which verifies the provider's
 * signature and calls settleOrder().
 *
 * Adding Payme or Click = one file here + one callback route. Nothing in
 * checkout, orders, the receipt page or the admin panel changes.
 */
export interface PaymentProvider {
  name: string
  checkoutUrl(order: Order): string
}

const providers: Record<string, PaymentProvider> = {
  test: testGateway,
}

export function getProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "test"
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown PAYMENT_PROVIDER "${name}"`)
  return provider
}
