import { Region, UniversityType } from "@/generated/prisma"
import { saveUniversity } from "../actions"

type Values = Partial<Record<"id" | "shortName" | "nameEn" | "nameUz" | "nameRu" | "website" | "region" | "type" | "suggestionId", string>>

const label = "block text-sm font-semibold text-ink-2"
const pretty = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())

export function UniversityForm({ values }: { values: Values }) {
  return (
    <form action={saveUniversity} className="grid gap-4 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {values.suggestionId && <input type="hidden" name="suggestionId" value={values.suggestionId} />}
      <label className={label}>Short name
        <input name="shortName" required defaultValue={values.shortName} placeholder="TUIT" className="field mt-1.5 font-normal" />
        <span className="mt-1 block text-xs font-normal text-ink-3">The handle people say out loud. Shown biggest on the board.</span>
      </label>
      <label className={label}>Official website
        <input name="website" required defaultValue={values.website} placeholder="tuit.uz" inputMode="url" autoCapitalize="none" className="field mt-1.5 font-normal" />
        <span className="mt-1 block text-xs font-normal text-ink-3">Any form works — it is reduced to the bare domain.</span>
      </label>
      <label className={`${label} sm:col-span-2`}>Name in English<input name="nameEn" required defaultValue={values.nameEn} className="field mt-1.5 font-normal" /></label>
      <label className={`${label} sm:col-span-2`}>Name in Uzbek<input name="nameUz" required defaultValue={values.nameUz} className="field mt-1.5 font-normal" /></label>
      <label className={`${label} sm:col-span-2`}>Name in Russian<input name="nameRu" required defaultValue={values.nameRu} className="field mt-1.5 font-normal" /></label>
      <label className={label}>Region
        <select name="region" defaultValue={values.region ?? "TASHKENT_CITY"} className="field mt-1.5 font-normal">
          {Object.values(Region).map((r) => <option key={r} value={r}>{pretty(r)}</option>)}
        </select>
      </label>
      <label className={label}>Type
        <select name="type" defaultValue={values.type ?? "STATE"} className="field mt-1.5 font-normal">
          {Object.values(UniversityType).map((v) => <option key={v} value={v}>{pretty(v)}</option>)}
        </select>
      </label>
      <div className="sm:col-span-2"><button className="btn-primary">{values.id ? "Save changes" : "Add to the board"}</button></div>
    </form>
  )
}
