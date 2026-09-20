import Link from "next/link"
import { db } from "@/lib/db"
import { rejectSuggestion } from "../actions"
import { Notice, PageTitle, when } from "../ui"

export default async function SuggestionsPage({ searchParams }: PageProps<"/admin/suggestions">) {
  const sp = await searchParams
  const [pending, decided] = await Promise.all([
    db.suggestion.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.suggestion.findMany({ where: { status: { not: "PENDING" } }, orderBy: { decidedAt: "desc" }, take: 20 }),
  ])
  return (
    <>
      <PageTitle title="Suggestions" sub="Universities visitors asked to add. Oldest first." />
      {typeof sp.ok === "string" && <Notice tone="ok">{sp.ok}</Notice>}
      {pending.length === 0 ? (
        <p className="card p-6 text-sm text-ink-3">Nothing to review. New suggestions from the “Add a university” page land here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm"><a href={`https://${s.domain}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">{s.domain} ↗</a>{s.contact && <span className="text-ink-2"> · {s.contact}</span>}</p>
                <p className="text-xs text-ink-3">{when(s.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/universities/new?suggestion=${s.id}`} className="btn-primary h-10 min-h-0 text-sm">Review & add</Link>
                <form action={rejectSuggestion}><input type="hidden" name="id" value={s.id} /><button className="btn-quiet h-10 min-h-0 text-sm">Reject</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {decided.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-ink-2">Recently decided ({decided.length})</summary>
          <ul className="card mt-3 divide-y divide-line text-sm">
            {decided.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 px-4 py-3"><span><b>{s.name}</b> <span className="text-ink-3">{s.domain}</span></span><span className={s.status === "APPROVED" ? "font-semibold text-up" : "text-ink-3"}>{s.status.toLowerCase()}</span></li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
