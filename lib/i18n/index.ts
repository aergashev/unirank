import uz, { type Dictionary } from "./uz"
import ru from "./ru"
import en from "./en"

export const LOCALES = ["uz", "ru", "en"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "uz"
export const LOCALE_LABEL: Record<Locale, string> = { uz: "Oʻzbekcha", ru: "Русский", en: "English" }

const dictionaries: Record<Locale, Dictionary> = { uz, ru, en }

export const hasLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)
export const getDictionary = (locale: Locale) => dictionaries[locale]
export type { Dictionary }

/** Fill `{name}` placeholders. */
export function t(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""))
}

const INTL: Record<Locale, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-US" }

/** 1 234 567 — the grouping Uzbek and Russian readers expect, used for all locales for one visual system. */
export function formatNumber(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function formatUzs(n: number, dict: Dictionary) {
  return `${formatNumber(n)} ${dict.currency}`
}

/** 324.8M-style short form for the stats strip; exact below a million. */
export function formatCompact(n: number, locale: Locale) {
  if (n < 1_000_000) return formatNumber(n)
  return new Intl.NumberFormat(INTL[locale], { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function formatDateTime(d: Date, locale: Locale) {
  return new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent",
  }).format(d)
}

export function formatDay(d: Date, locale: Locale) {
  return new Intl.DateTimeFormat(INTL[locale], { day: "numeric", month: "short", timeZone: "Asia/Tashkent" }).format(d)
}

export function timeAgo(iso: string, dict: Dictionary, now = Date.now()) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (min < 1) return dict.time.now
  if (min < 60) return t(dict.time.min, { n: min })
  if (min < 60 * 24) return t(dict.time.hour, { n: Math.floor(min / 60) })
  return t(dict.time.day, { n: Math.floor(min / (60 * 24)) })
}

export function uniName(u: { nameUz: string; nameRu: string; nameEn: string }, locale: Locale) {
  return locale === "ru" ? u.nameRu : locale === "en" ? u.nameEn : u.nameUz
}
