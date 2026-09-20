import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatNumber } from "@/lib/i18n"
import { expireStaleOrders } from "@/lib/orders"
import { signCallback, testGatewayEnabled } from "@/lib/payments/test-gateway"

export const dynamic = "force-dynamic"

export default async function TestGatewayPage({ params }: PageProps<"/pay/test/[id]">) {
  if (!testGatewayEnabled()) notFound()
  const { id } = await params
  await expireStaleOrders()
  const order = await db.order.findUnique({ where: { publicId: id }, include: { university: { select: { shortName: true } } } })
  if (!order) notFound()
  // Only an open order can be paid; anything else already has an outcome.
  if (order.status !== "PENDING") redirect(`/${order.locale}/orders/${order.publicId}`)

  return (
    <main className="w-full max-w-sm rounded-lg border border-[#c9ced8] bg-white p-6 shadow-sm">
      <p className="rounded bg-[#fff3cd] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#7a5b00]">Sandbox — no real money moves</p>
      <h1 className="mt-5 text-lg font-bold">Test Payment Gateway</h1>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-[#5d6675]">Merchant</dt><dd>UniRank</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-[#5d6675]">Order</dt><dd>{order.publicId}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-[#5d6675]">For</dt><dd>{formatNumber(order.power)} POWER → {order.university.shortName}</dd></div>
        <div className="flex justify-between gap-4 border-t border-[#e3e6ec] pt-3 text-base font-bold"><dt>Amount</dt><dd>{formatNumber(order.amountUzs)} UZS</dd></div>
      </dl>
      <form action="/api/payments/test/callback" method="post" className="mt-6 flex flex-col gap-2">
        <input type="hidden" name="order" value={order.publicId} />
        <input type="hidden" name="amount" value={order.amountUzs} />
        <input type="hidden" name="sigPaid" value={signCallback(order.publicId, "paid", order.amountUzs)} />
        <input type="hidden" name="sigDeclined" value={signCallback(order.publicId, "declined", order.amountUzs)} />
        <button name="outcome" value="paid" className="h-12 rounded bg-[#1d2430] font-bold text-white hover:bg-black">Approve payment</button>
        <button name="outcome" value="declined" className="h-12 rounded border border-[#c9ced8] font-bold hover:bg-[#f4f5f7]">Decline</button>
      </form>
    </main>
  )
}
