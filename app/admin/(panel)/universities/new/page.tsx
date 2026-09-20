import Link from "next/link"
import { db } from "@/lib/db"
import { Notice, PageTitle } from "../../ui"
import { UniversityForm } from "../form"

export default async function NewUniversityPage({ searchParams }: PageProps<"/admin/universities/new">) {
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined)
  // Arriving from a suggestion pre-fills what the visitor sent.
  const suggestion = str("suggestion") ? await db.suggestion.findUnique({ where: { id: str("suggestion")! } }) : null
  return (
    <>
      <Link href="/admin/universities" className="text-sm font-semibold text-ink-2 hover:text-ink">← Universities</Link>
      <div className="mt-3"><PageTitle title="Add university" sub={suggestion ? `From a suggestion: “${suggestion.name}” — ${suggestion.website}` : "It joins the board at 0 POWER."} /></div>
      {str("error") && <Notice tone="error">{str("error")}</Notice>}
      <div className="card max-w-3xl p-5 sm:p-6">
        <UniversityForm values={{
          shortName: str("shortName"), nameEn: str("nameEn") ?? suggestion?.name, nameUz: str("nameUz") ?? suggestion?.name, nameRu: str("nameRu") ?? suggestion?.name,
          website: str("website") ?? suggestion?.domain, region: str("region"), type: str("type"), suggestionId: str("suggestionId") ?? suggestion?.id,
        }} />
      </div>
    </>
  )
}
