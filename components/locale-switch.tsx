"use client"

import { usePathname, useRouter } from "next/navigation"
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n"
import { Globe } from "./icons"

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <label className="relative flex items-center gap-1.5 rounded-full border border-line-strong bg-white pl-3 text-sm font-semibold text-ink hover:border-ink-3">
      <Globe width={16} height={16} className="text-ink-3" />
      <span className="sr-only">{label}</span>
      <select
        value={locale}
        onChange={(e) => {
          const rest = pathname.split("/").slice(2).join("/")
          router.push(`/${e.target.value}${rest ? `/${rest}` : ""}`)
        }}
        className="h-10 cursor-pointer appearance-none bg-transparent pr-3 outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABEL[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
