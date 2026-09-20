import Link from "next/link"
import { getOverview } from "@/lib/admin-stats"
import { expireStaleOrders } from "@/lib/orders"
import { testGatewayEnabled } from "@/lib/payments/test-gateway"
import { PageTitle, StatusPill, fmt, td, th, when } from "./ui"

export default async function Overview() {
  await expireStaleOrders()
  const { periods, pendingOrders, pendingSuggestions, latest } = await getOverview()

  return (
    <>
      <PageTitle title="Overview" />
      {testGatewayEnabled() && (
        <p className="mb-5 rounded-control bg-bolt-soft p-3 text-sm text-[#6b4700]">
          <b>Sandbox payments are on.</b> Orders are approved on a test page and no money is collected, so the sums below are not revenue.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {periods.map((p) => (
          <section key={p.label} className="card p-5">
            <h2 className="text-sm font-semibold text-ink-2">{p.label}</h2>
            <p className="num mt-2 text-2xl font-extrabold tracking-tight">{fmt(p.v._sum.amountUzs ?? 0)} <span className="text-base font-bold text-ink-3">UZS</span></p>
            <p className="num mt-1 text-sm text-ink-2">{fmt(p.v._sum.power ?? 0)} POWER · {fmt(p.v._count)} paid orders</p>
          </section>
        ))}
      </div>

      {(pendingSuggestions > 0 || pendingOrders > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {pendingSuggestions > 0 && <Link href="/admin/suggestions" className="btn-quiet text-sm">{pendingSuggestions} suggestion{pendingSuggestions > 1 ? "s" : ""} to review →</Link>}
          {pendingOrders > 0 && <Link href="/admin/orders?status=PENDING" className="btn-quiet text-sm">{pendingOrders} order{pendingOrders > 1 ? "s" : ""} awaiting payment →</Link>}
        </div>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-bold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">All orders →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="p-4 text-sm text-ink-3">No orders yet. They appear here as soon as someone gives POWER.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-sm">
              <thead><tr><th className={th}>Order</th><th className={th}>University</th><th className={`${th} text-right`}>POWER</th><th className={`${th} text-right`}>UZS</th><th className={th}>Status</th><th className={th}>Created</th></tr></thead>
              <tbody className="divide-y divide-line">
                {latest.map((o) => (
                  <tr key={o.id}>
                    <td className={td}><Link href={`/admin/orders?q=${o.publicId}`} className="num font-semibold tracking-wider text-brand hover:underline">{o.publicId}</Link></td>
                    <td className={td}>{o.university.shortName}</td>
                    <td className={`${td} num text-right font-semibold`}>{fmt(o.power)}</td>
                    <td className={`${td} num text-right`}>{fmt(o.amountUzs)}</td>
                    <td className={td}><StatusPill status={o.status} /></td>
                    <td className={`${td} whitespace-nowrap text-ink-2`}>{when(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
