import Link from "next/link"
import { notFound } from "next/navigation"
import { UniLogo } from "@/components/uni-logo"
import { db } from "@/lib/db"
import { rankOf } from "@/lib/ranking"
import { deleteUniversity, grantPower, removeLogo, setHidden, uploadLogo } from "../../actions"
import { ConfirmButton } from "../../confirm-button"
import { Notice, PageTitle, fmt } from "../../ui"
import { UniversityForm } from "../form"

export default async function EditUniversityPage({ params, searchParams }: PageProps<"/admin/universities/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const u = await db.university.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } })
  if (!u) notFound()
  const rank = u.hidden ? null : await rankOf(u)

  return (
    <>
      <Link href="/admin/universities" className="text-sm font-semibold text-ink-2 hover:text-ink">← Universities</Link>
      <div className="mt-3">
        <PageTitle title={u.shortName} sub={`${rank ? `№${rank}` : "Hidden"} · ${fmt(u.power)} POWER · ${fmt(u._count.orders)} orders`}>
          <div className="flex gap-2">
            <Link href={`/admin/orders?q=${encodeURIComponent(u.shortName)}`} className="btn-quiet text-sm">Its orders</Link>
            {!u.hidden && <Link href={`/en/u/${u.slug}`} target="_blank" className="btn-quiet text-sm">Public page ↗</Link>}
          </div>
        </PageTitle>
      </div>
      {typeof sp.ok === "string" && <Notice tone="ok">{sp.ok}</Notice>}
      {typeof sp.error === "string" && <Notice tone="error">{sp.error}</Notice>}

      <div className="grid max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-bold">Details</h2>
          <UniversityForm values={{ id: u.id, shortName: u.shortName, nameEn: u.nameEn, nameUz: u.nameUz, nameRu: u.nameRu, website: u.domain, region: u.region, type: u.type }} />
        </section>

        <div className="flex flex-col gap-5">
          <section className="card p-5">
            <h2 className="mb-3 font-bold">Logo</h2>
            <div className="flex items-center gap-4">
              <UniLogo slug={u.slug} shortName={u.shortName} logoPath={u.logoPath} size={64} />
              <p className="text-xs text-ink-3">Square PNG, JPEG or WebP, up to 300 KB. {u.logoPath ? "" : "Until one is uploaded, this monogram is shown."}</p>
            </div>
            <form action={uploadLogo} className="mt-4 flex flex-col gap-2">
              <input type="hidden" name="id" value={u.id} />
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required aria-label="Logo file" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-2 file:font-semibold" />
              <button className="btn-quiet h-10 min-h-0 text-sm">Upload logo</button>
            </form>
            {u.logoPath && <form action={removeLogo} className="mt-2"><input type="hidden" name="id" value={u.id} /><button className="text-sm font-semibold text-ink-2 hover:text-down">Remove logo</button></form>}
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Grant POWER</h2>
            <p className="mt-1 text-xs text-ink-3">Without a payment — a prize or a correction. Logged, and reversible by refunding the order it creates.</p>
            <form action={grantPower} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={u.id} />
              <input name="power" type="number" min={1} step={1} required placeholder="POWER" aria-label="POWER to grant" className="field h-10 min-h-0 text-sm" />
              <input name="reason" required minLength={3} placeholder="Reason (audit log)" aria-label="Reason" className="field h-10 min-h-0 text-sm" />
              <button className="btn-quiet h-10 min-h-0 text-sm">Grant</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Visibility</h2>
            <p className="mt-1 text-xs text-ink-3">{u.hidden ? "Hidden: not on the board, cannot receive POWER. Its POWER and orders are kept." : "Hiding removes it from the board and stops new orders. Nothing is deleted."}</p>
            <form action={setHidden} className="mt-3">
              <input type="hidden" name="id" value={u.id} />
              <input type="hidden" name="hidden" value={u.hidden ? "0" : "1"} />
              <button className="btn-quiet h-10 min-h-0 w-full text-sm">{u.hidden ? "Show on the board" : "Hide from the board"}</button>
            </form>
            {u._count.orders === 0 && (
              <form action={deleteUniversity} className="mt-2">
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton message={`Delete ${u.shortName} permanently? This cannot be undone.`} className="h-10 w-full rounded-control text-sm font-semibold text-down hover:bg-down-soft">Delete permanently</ConfirmButton>
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
