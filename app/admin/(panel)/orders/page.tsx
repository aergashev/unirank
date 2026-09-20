import Link from "next/link"
import { OrderStatus, type Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { expireStaleOrders } from "@/lib/orders"
import { orderAction } from "../actions"
import { ConfirmButton } from "../confirm-button"
import { Notice, PageTitle, StatusPill, fmt, td, th, when } from "../ui"

const PAGE = 30
const act = "rounded-lg border border-line-strong px-2.5 py-1.5 text-xs font-semibold hover:border-ink-3 hover:bg-paper"

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams
  await expireStaleOrders()
  const status = Object.values(OrderStatus).find((s) => s === sp.status)
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const page = Math.max(1, Number(sp.page) || 1)

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { publicId: { contains: q.toUpperCase() } },
      { displayName: { contains: q, mode: "insensitive" } },
      { university: { shortName: { contains: q, mode: "insensitive" } } },
    ] } : {}),
  }
  const [orders, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { university: { select: { shortName: true, id: true } } } }),
    db.order.count({ where }),
  ])
  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries({ status, q: q || undefined, ...patch })) if (v) next.set(k, v)
    return `/admin/orders${next.size ? `?${next}` : ""}`
  }
  const here = link({ page: page > 1 ? String(page) : undefined })

  return (
    <>
      <PageTitle title="Orders" sub={`${fmt(total)} order${total === 1 ? "" : "s"}${status || q ? " match" : ""}`} />
      {typeof sp.ok === "string" && <Notice tone="ok">{sp.ok}</Notice>}
      {typeof sp.error === "string" && <Notice tone="error">{sp.error}</Notice>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="flex gap-2" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Order number, name or university" aria-label="Search orders" className="field h-10 min-h-0 w-72 max-w-full text-sm" />
          <button className="btn-quiet h-10 min-h-0 text-sm">Search</button>
        </form>
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Filter by status">
          {[undefined, ...Object.values(OrderStatus)].map((s) => (
            <Link key={s ?? "all"} href={link({ status: s, page: undefined })} aria-current={s === status ? "true" : undefined}
              className="rounded-full px-3 py-1.5 font-semibold text-ink-2 hover:bg-white aria-[current=true]:bg-ink aria-[current=true]:text-white">
              {s ? s.toLowerCase() : "all"}
            </Link>
          ))}
        </nav>
      </div>

      <div className="card overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-ink-3">{status || q ? "Nothing matches these filters." : "No orders yet."} {(status || q) && <Link href="/admin/orders" className="font-semibold text-brand hover:underline">Clear filters</Link>}</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr><th className={th}>Order</th><th className={th}>University</th><th className={`${th} text-right`}>POWER</th><th className={`${th} text-right`}>UZS</th><th className={th}>Supporter</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={td}>
                    <p className="num font-semibold tracking-wider">{o.publicId}</p>
                    <p className="whitespace-nowrap text-xs text-ink-3">{when(o.paidAt ?? o.createdAt)} · {o.provider}</p>
                  </td>
                  <td className={td}><Link href={`/admin/universities/${o.university.id}`} className="font-semibold hover:text-brand">{o.university.shortName}</Link></td>
                  <td className={`${td} num text-right font-semibold`}>{fmt(o.power)}</td>
                  <td className={`${td} num text-right`}>{fmt(o.amountUzs)}</td>
                  <td className={`${td} max-w-64`}>
                    <p className={o.muted ? "text-ink-3 line-through" : ""}>{o.displayName ?? <span className="text-ink-3">Anonymous</span>}</p>
                    {o.message && <p className={`break-words text-xs ${o.muted ? "text-ink-3 line-through" : "text-ink-2"}`}>{o.message}</p>}
                  </td>
                  <td className={td}><StatusPill status={o.status} /></td>
                  <td className={td}>
                    <form action={orderAction} className="flex flex-wrap gap-1.5">
                      <input type="hidden" name="publicId" value={o.publicId} />
                      <input type="hidden" name="back" value={here} />
                      {(o.status === "PENDING" || o.status === "FAILED" || o.status === "EXPIRED") && (
                        <ConfirmButton name="action" value="confirm" className={act} message={`Mark ${o.publicId} as paid and credit ${o.power} POWER to ${o.university.shortName}? Do this only when the money has really arrived.`}>Mark paid</ConfirmButton>
                      )}
                      {o.status === "PAID" && (
                        <ConfirmButton name="action" value="refund" className={`${act} text-down`} message={`Refund ${o.publicId}? ${o.power} POWER will be removed from ${o.university.shortName}.`}>Refund</ConfirmButton>
                      )}
                      {(o.displayName || o.message) && <button name="action" value={o.muted ? "unmute" : "mute"} className={act}>{o.muted ? "Unhide name" : "Hide name"}</button>}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > PAGE && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={link({ page: String(page - 1) })} className="btn-quiet h-10 min-h-0">← Newer</Link> : <span />}
          <span className="num text-ink-3">Page {page} of {Math.ceil(total / PAGE)}</span>
          {page * PAGE < total ? <Link href={link({ page: String(page + 1) })} className="btn-quiet h-10 min-h-0">Older →</Link> : <span />}
        </nav>
      )}
    </>
  )
}
