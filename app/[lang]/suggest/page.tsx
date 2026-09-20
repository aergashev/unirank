import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDictionary, hasLocale } from "@/lib/i18n"
import { SuggestForm } from "./form"

export async function generateMetadata({ params }: PageProps<"/[lang]/suggest">): Promise<Metadata> {
  const { lang } = await params
  return hasLocale(lang) ? { title: getDictionary(lang).nav.suggest } : {}
}

export default async function SuggestPage({ params }: PageProps<"/[lang]/suggest">) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = getDictionary(lang)
  return (
    <div className="mx-auto max-w-lg pt-10 sm:pt-16">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{dict.suggest.title}</h1>
      <p className="mt-3 text-lg text-ink-2">{dict.suggest.sub}</p>
      <div className="card mt-8 p-6 sm:p-8"><SuggestForm locale={lang} dict={dict} /></div>
    </div>
  )
}
