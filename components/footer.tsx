import Link from "next/link"
import type { Dictionary, Locale } from "@/lib/i18n"
import { Wordmark } from "./brand"

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-2 sm:flex-row sm:items-center sm:px-6">
        <div>
          <Wordmark />
          <p className="mt-1">{dict.footer.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
          <Link href={`/${locale}/how`} className="hover:text-ink">{dict.nav.how}</Link>
          <Link href={`/${locale}/suggest`} className="hover:text-ink">{dict.nav.suggest}</Link>
        </nav>
        <p className="text-ink-3">© {new Date().getFullYear()} UniRank. {dict.footer.rights}</p>
      </div>
    </footer>
  )
}
