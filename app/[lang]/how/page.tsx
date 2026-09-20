import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "@/components/icons"
import { formatUzs, getDictionary, hasLocale, t } from "@/lib/i18n"
import { getSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/[lang]/how">): Promise<Metadata> {
  const { lang } = await params
  return hasLocale(lang) ? { title: getDictionary(lang).nav.how } : {}
}

export default async function HowPage({ params }: PageProps<"/[lang]/how">) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = getDictionary(lang)
  const price = formatUzs((await getSettings()).unitPriceUzs, dict)
  return (
    <div className="mx-auto max-w-3xl pt-10 sm:pt-16">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{dict.how.title}</h1>
      <p className="mt-4 text-lg text-ink-2">{dict.how.lead}</p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {dict.how.steps.map((s, i) => (
          <li key={s.title} className="card p-5">
            <span className="num grid size-9 place-items-center rounded-full bg-brand-soft font-extrabold text-brand">{i + 1}</span>
            <h2 className="mt-4 font-bold">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{t(s.text, { price })}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 text-2xl font-extrabold tracking-tight">{dict.how.faqTitle}</h2>
      <div className="card mt-4 divide-y divide-line">
        {dict.how.faq.map((f) => (
          <details key={f.q} className="group px-5 sm:px-6">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="text-xl text-ink-3 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-5 leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>

      <Link href={`/${lang}`} className="btn-primary mt-10">{dict.how.cta} <ArrowRight width={18} height={18} /></Link>
    </div>
  )
}
