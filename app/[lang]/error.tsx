"use client"

import { useParams } from "next/navigation"
import { DEFAULT_LOCALE, getDictionary, hasLocale } from "@/lib/i18n"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>()
  const dict = getDictionary(hasLocale(lang) ? lang : DEFAULT_LOCALE)
  return (
    <div className="mx-auto max-w-md pt-24 text-center">
      <h1 className="text-2xl font-extrabold">{dict.error.title}</h1>
      <p className="mt-2 text-ink-2">{dict.error.text}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">{dict.error.retry}</button>
    </div>
  )
}
