import Link from "next/link"
import type { Dictionary, Locale } from "@/lib/i18n"
import { Wordmark } from "./brand"
import { LocaleSwitch } from "./locale-switch"

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${locale}`, label: dict.nav.board },
    { href: `/${locale}/how`, label: dict.nav.how },
    { href: `/${locale}/suggest`, label: dict.nav.suggest },
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href={`/${locale}`} className="mr-2 sm:mr-6" aria-label="UniRank">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 text-[0.95rem] font-medium text-ink-2 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 hover:bg-white hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <LocaleSwitch locale={locale} label={dict.nav.language} />
        </div>
      </div>
      {/* Three links fit on a phone, so they stay visible instead of hiding behind a menu. */}
      <nav className="flex gap-1 overflow-x-auto border-t border-line/70 px-3 py-1.5 text-sm font-medium text-ink-2 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-white">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
