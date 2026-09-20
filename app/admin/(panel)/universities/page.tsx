import Link from "next/link"
import { UniLogo } from "@/components/uni-logo"
import { db } from "@/lib/db"
import { Notice, PageTitle, fmt, td, th } from "../ui"

export default async function UniversitiesPage({ searchParams }: PageProps<"/admin/universities">) {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const rows = await db.university.findMany({
    where: q ? { OR: ["shortName", "nameEn", "nameUz", "nameRu", "domain"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) } : {},
    orderBy: [{ power: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { orders: { where: { status: "PAID" } } } } },
  })
  return (
    <>
      <PageTitle title="Universities" sub={`${rows.length} ${q ? "match" : "listed"}`}>
        <Link href="/admin/universities/new" className="btn-primary">Add university</Link>
      </PageTitle>
      {typeof sp.ok === "string" && <Notice tone="ok">{sp.ok}</Notice>}
      <form className="mb-4 flex gap-2" action="/admin/universities">
        <input name="q" defaultValue={q} placeholder="Name or website" aria-label="Search universities" className="field h-10 min-h-0 w-72 max-w-full text-sm" />
        <button className="btn-quiet h-10 min-h-0 text-sm">Search</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-ink-3">No university matches “{q}”. <Link href="/admin/universities" className="font-semibold text-brand hover:underline">Show all</Link></p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr><th className={th}>University</th><th className={th}>Website</th><th className={th}>Type</th><th className={`${th} text-right`}>POWER</th><th className={`${th} text-right`}>Paid orders</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.id} className={u.hidden ? "bg-paper/60 text-ink-3" : ""}>
                  <td className={td}>
                    <Link href={`/admin/universities/${u.id}`} className="flex items-center gap-3 hover:text-brand">
                      <UniLogo slug={u.slug} shortName={u.shortName} logoPath={u.logoPath} size={36} />
                      <span><span className="block font-bold">{u.shortName}{u.hidden && <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-ink-2">hidden</span>}</span><span className="block text-xs text-ink-3">{u.nameEn}</span></span>
                    </Link>
                  </td>
                  <td className={td}>{u.domain}</td>
                  <td className={`${td} lowercase`}>{u.type}</td>
                  <td className={`${td} num text-right font-semibold`}>{fmt(u.power)}</td>
                  <td className={`${td} num text-right`}>{fmt(u._count.orders)}</td>
                  <td className={`${td} text-right`}><Link href={`/admin/universities/${u.id}`} className="font-semibold text-brand hover:underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
