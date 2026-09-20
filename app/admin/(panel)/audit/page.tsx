import { db } from "@/lib/db"
import { PageTitle, td, th, when } from "../ui"

export default async function AuditPage() {
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { admin: { select: { email: true } } } })
  return (
    <>
      <PageTitle title="Audit log" sub="The last 200 admin actions." />
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <p className="p-6 text-sm text-ink-3">No admin actions recorded yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className={th}>When</th><th className={th}>Admin</th><th className={th}>Action</th><th className={th}>Target</th><th className={th}>Detail</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}><td className={`${td} whitespace-nowrap text-ink-2`}>{when(r.createdAt)}</td><td className={td}>{r.admin.email}</td><td className={`${td} font-semibold`}>{r.action}</td><td className={`${td} num`}>{r.target}</td><td className={`${td} break-all text-ink-2`}>{r.detail}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
