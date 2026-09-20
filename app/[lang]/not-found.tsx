import Link from "next/link"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, getDictionary, hasLocale } from "@/lib/i18n"

// not-found receives no params, so the language comes from the cookie the proxy keeps in sync.
export default async function NotFound() {
  const saved = (await cookies()).get("unirank_locale")?.value ?? ""
  const locale = hasLocale(saved) ? saved : DEFAULT_LOCALE
  const dict = getDictionary(locale)
  return (
    <div className="mx-auto max-w-md pt-24 text-center">
      <p className="num text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">{dict.notFound.title}</h1>
      <p className="mt-2 text-ink-2">{dict.notFound.text}</p>
      <Link href={`/${locale}`} className="btn-primary mt-6">{dict.notFound.cta}</Link>
    </div>
  )
}
