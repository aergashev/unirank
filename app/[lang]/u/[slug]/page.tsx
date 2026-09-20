import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { GiveForm } from "@/components/give-form"
import { ArrowLeft, External } from "@/components/icons"
import { PowerChart } from "@/components/power-chart"
import { Share } from "@/components/share"
import { Supporters } from "@/components/supporters"
import { UniLogo } from "@/components/uni-logo"
import { formatNumber, getDictionary, hasLocale, t, uniName } from "@/lib/i18n"
import { testGatewayEnabled } from "@/lib/payments/test-gateway"
import { getSettings } from "@/lib/settings"
import { getUniversityPage } from "@/lib/university"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLocale(lang)) return {}
  const page = await getUniversityPage(slug)
  if (!page) return {}
  const dict = getDictionary(lang)
  return { title: `${page.row.shortName} — №${page.row.rank}`, description: t(dict.uni.shareText, { uni: uniName(page.row, lang), rank: page.row.rank }) }
}

export default async function UniversityPage({ params, searchParams }: PageProps<"/[lang]/u/[slug]">) {
  const { lang, slug } = await params
  if (!hasLocale(lang)) notFound()
  const [page, settings, query] = await Promise.all([getUniversityPage(slug), getSettings(), searchParams])
  if (!page) notFound()
  const dict = getDictionary(lang)
  const { row } = page
  // A failed or expired order links back here with the amount it was for.
  const wanted = Number(query.power)
  const initialAmount = Number.isInteger(wanted) && wanted >= 1 && wanted <= settings.maxPowerPerOrder ? wanted : 5

  const facts = [
    { label: dict.uni.rank, value: `№${row.rank}` },
    { label: dict.uni.power, value: formatNumber(row.power) },
    { label: dict.uni.supporters, value: formatNumber(page.supporters) },
  ]

  return (
    <div className="pt-6">
      <Link href={`/${lang}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft width={16} height={16} /> {dict.uni.back}
      </Link>

      <div className="mt-2 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex items-start gap-4">
            <UniLogo slug={row.slug} shortName={row.shortName} logoPath={row.logoPath} size={72} />
            <div className="min-w-0">
              <p className="eyebrow">{dict.region[row.region as keyof typeof dict.region]} · {dict.type[row.type as keyof typeof dict.type]}</p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{uniName(row, lang)}</h1>
              <a href={`https://${page.domain}`} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                {page.domain} <External width={14} height={14} /><span className="sr-only">({dict.uni.site})</span>
              </a>
            </div>
          </header>

          <dl className="card grid grid-cols-3 divide-x divide-line">
            {facts.map((f) => (
              <div key={f.label} className="px-3 py-4 text-center sm:px-5 sm:py-5">
                <dd className="num text-2xl font-extrabold tracking-tight sm:text-3xl">{f.value}</dd>
                <dt className="mt-0.5 text-xs text-ink-3 sm:text-sm">{f.label}</dt>
              </div>
            ))}
          </dl>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-bold">{dict.uni.chart}</h2>
            <PowerChart days={page.days} locale={lang} dict={dict} />
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-bold">{dict.uni.recent}</h2>
            <Supporters items={page.recent} dict={dict} />
          </section>

          <section className="card overflow-hidden">
            <h2 className="px-5 pt-5 font-bold sm:px-6">{dict.uni.neighbours}</h2>
            <ol className="mt-3 divide-y divide-line">
              {page.neighbours.map((n) => (
                <li key={n.id} className={n.id === row.id ? "bg-brand-soft" : ""}>
                  <Link href={`/${lang}/u/${n.slug}`} aria-current={n.id === row.id ? "page" : undefined} className="flex items-center gap-3 px-5 py-3 hover:bg-paper sm:px-6">
                    <span className="num w-8 text-sm font-bold text-ink-2">№{n.rank}</span>
                    <UniLogo slug={n.slug} shortName={n.shortName} logoPath={n.logoPath} size={32} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{n.shortName}</span>
                    <span className="num font-bold">{formatNumber(n.power)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* On phones the form comes first in reading order: it is why people open this page. */}
        <aside className="flex flex-col gap-4 max-lg:order-first lg:sticky lg:top-24">
          <section className="card p-5 sm:p-6" aria-labelledby="give-heading">
            <h2 id="give-heading" className="mb-4 text-lg font-extrabold">{dict.give.title}</h2>
            <GiveForm
              target={{ id: row.id, shortName: row.shortName, power: row.power, rank: row.rank, ahead: page.ahead.map((a) => ({ shortName: a.shortName, power: a.power, rank: a.rank })) }}
              locale={lang} dict={dict} unitPrice={settings.unitPriceUzs} maxPower={settings.maxPowerPerOrder}
              sandbox={testGatewayEnabled()} initialAmount={initialAmount}
            />
          </section>
          <section className="px-1">
            <h2 className="mb-2 text-sm font-semibold text-ink-2">{dict.uni.share}</h2>
            <Share path={`/${lang}/u/${row.slug}`} text={t(dict.uni.shareText, { uni: row.shortName, rank: row.rank })} labels={{ telegram: "Telegram", copy: dict.uni.copy, copied: dict.uni.copied }} />
          </section>
        </aside>
      </div>
    </div>
  )
}
