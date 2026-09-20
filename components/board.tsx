"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { HomeData } from "@/lib/home-data"
import { type Dictionary, type Locale, formatCompact, formatNumber, formatUzs, t, uniName } from "@/lib/i18n"
import { Feed } from "./feed"
import { type DialogTarget, GiveDialog } from "./give-dialog"
import { ArrowRight, Bolt, Plus, Search } from "./icons"
import { UniLogo } from "./uni-logo"

const TOP = 10
const POLL_MS = 15_000
const MEDAL = ["bg-gold text-ink", "bg-silver text-ink", "bg-bronze text-ink"]

export function Board({
  initial, locale, dict, unitPrice, maxPower, sandbox,
}: { initial: HomeData; locale: Locale; dict: Dictionary; unitPrice: number; maxPower: number; sandbox: boolean }) {
  const [data, setData] = useState(initial)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [flash, setFlash] = useState<Set<string>>(new Set())
  const powers = useRef(new Map(initial.rows.map((r) => [r.id, r.power])))

  // Poll while the tab is visible; flash rows whose POWER grew since last time.
  useEffect(() => {
    let stop = false
    async function refresh() {
      if (document.hidden) return
      try {
        const res = await fetch("/api/board", { cache: "no-store" })
        if (!res.ok || stop) return
        const next: HomeData = await res.json()
        const changed = new Set(next.rows.filter((r) => (powers.current.get(r.id) ?? r.power) < r.power).map((r) => r.id))
        powers.current = new Map(next.rows.map((r) => [r.id, r.power]))
        setData(next)
        if (changed.size) {
          setFlash(changed)
          setTimeout(() => !stop && setFlash(new Set()), 1700)
        }
      } catch {
        // A missed refresh is harmless; the next tick retries.
      }
    }
    const timer = setInterval(refresh, POLL_MS)
    document.addEventListener("visibilitychange", refresh)
    return () => { stop = true; clearInterval(timer); document.removeEventListener("visibilitychange", refresh) }
  }, [])

  const { rows, stats, feed, gainer } = data
  const leader = rows[0]?.power ?? 0
  const q = query.trim().toLowerCase()
  const visible = useMemo(() => {
    if (!q) return showAll ? rows : rows.slice(0, TOP)
    const needle = q.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
    return rows.filter((r) =>
      [r.shortName, r.nameUz, r.nameRu, r.nameEn, r.slug].some((s) => s.toLowerCase().includes(q)) || r.slug.includes(needle),
    )
  }, [rows, q, showAll])

  const target: DialogTarget | null = useMemo(() => {
    const r = rows.find((x) => x.id === targetId)
    if (!r) return null
    return {
      id: r.id, slug: r.slug, shortName: r.shortName, name: uniName(r, locale), logoPath: r.logoPath, power: r.power, rank: r.rank,
      ahead: rows.slice(0, r.rank - 1).map((a) => ({ shortName: a.shortName, power: a.power, rank: a.rank })),
    }
  }, [rows, targetId, locale])

  const price = formatUzs(unitPrice, dict)
  const statItems = [
    { value: formatNumber(stats.universities), label: dict.stats.universities },
    { value: formatCompact(stats.power, locale), label: dict.stats.power },
    { value: `${formatCompact(stats.amountUzs, locale)} ${dict.currency}`, label: dict.stats.raised },
    { value: formatCompact(stats.supporters, locale), label: dict.stats.supporters },
  ]

  return (
    <>
      <section className="pb-8 pt-10 sm:pt-14">
        <p className="eyebrow">{dict.hero.eyebrow}</p>
        <h1 className="mt-3 text-balance text-[2.35rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          {dict.hero.titleA} <span className="text-brand">{dict.hero.titleTop}</span>{dict.hero.titleB}
        </h1>
        <p className="mt-4 text-lg text-ink-2 sm:text-xl">{dict.hero.sub}</p>

        <div className="relative mt-7 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={dict.board.searchLabel}
            placeholder={dict.board.search}
            className="field h-14 rounded-full pl-12 text-base shadow-card"
          />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:gap-10">
          {statItems.map((s) => (
            <div key={s.label}>
              <dd className="num text-2xl font-extrabold tracking-tight">{s.value}</dd>
              <dt className="text-sm text-ink-3">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="board-title" className="card overflow-hidden">
          <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-4 pb-3 pt-5 sm:px-6">
            <div>
              <h2 id="board-title" className="text-2xl font-extrabold tracking-tight">{dict.board.title}</h2>
              <p className="flex items-center gap-2 text-sm text-ink-3">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-60 motion-reduce:hidden" /><span className="relative inline-flex size-2 rounded-full bg-up" /></span>
                {dict.board.live}
              </p>
            </div>
            {/* The price is said once here, not repeated under every button. */}
            <p className="flex items-center gap-1.5 rounded-full bg-bolt-soft px-3 py-1.5 text-sm font-semibold text-ink">
              <Bolt width={14} height={14} className="text-bolt" /> {t(dict.board.price, { price })}
            </p>
          </header>

          {leader === 0 && !q && <p className="mx-4 mb-2 rounded-control bg-brand-soft px-4 py-3 text-sm font-medium text-navy sm:mx-6">{dict.board.allZero}</p>}

          {visible.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-ink-2">{t(dict.board.noMatch, { query: query.trim() })}</p>
              <Link href={`/${locale}/suggest`} className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-brand hover:underline">
                {dict.board.noMatchCta} <ArrowRight width={16} height={16} />
              </Link>
            </div>
          ) : (
            <ol className="divide-y divide-line">
              {visible.map((r) => (
                <li key={r.id} className={`flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 ${flash.has(r.id) ? "row-flash" : ""}`}>
                  <span className={`num grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${leader > 0 && r.rank <= 3 ? MEDAL[r.rank - 1] : "bg-paper text-ink-2"}`}>
                    {r.rank}
                  </span>
                  <Link href={`/${locale}/u/${r.slug}`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <UniLogo slug={r.slug} shortName={r.shortName} logoPath={r.logoPath} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold leading-tight group-hover:text-brand">{r.shortName}</span>
                      <span className="block truncate text-sm text-ink-3">{uniName(r, locale)}</span>
                    </span>
                  </Link>
                  <div className="hidden w-36 shrink-0 sm:block">
                    <p className="num text-right text-base font-bold">{formatNumber(r.power)}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper" aria-hidden>
                      <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${r.power ? Math.max(2, (r.power / leader) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <p className="num shrink-0 text-right text-sm font-bold sm:hidden">{formatNumber(r.power)}</p>
                  <button type="button" onClick={() => setTargetId(r.id)} aria-label={t(dict.board.giveTo, { name: r.shortName })} className="btn-primary shrink-0 max-sm:w-11 max-sm:px-0">
                    <Plus width={18} height={18} /> <span className="max-sm:hidden">{dict.board.give}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}

          {!q && rows.length > TOP && (
            <div className="border-t border-line p-3 text-center">
              <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-quiet border-transparent text-sm text-ink-2">
                {showAll ? dict.board.showLess : t(dict.board.showAll, { count: rows.length })}
              </button>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="card p-5">
            <h2 className="mb-4 font-bold">{dict.rail.feed}</h2>
            <Feed items={feed} locale={locale} dict={dict} empty={dict.rail.feedEmpty} />
          </section>

          {gainer && (
            <Link href={`/${locale}/u/${gainer.slug}`} className="card flex items-center gap-3 p-5 transition-colors hover:border-line-strong">
              <UniLogo slug={gainer.slug} shortName={gainer.shortName} logoPath={gainer.logoPath} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-ink-3">{dict.rail.gainer}</span>
                <span className="block truncate font-bold">{gainer.shortName}</span>
              </span>
              <span className="num font-extrabold text-up">+{formatNumber(gainer.gained)}</span>
            </Link>
          )}

          <section className="rounded-card bg-navy p-5 text-white">
            <h2 className="font-bold">{dict.rail.howTitle}</h2>
            <ol className="mt-3 flex flex-col gap-2.5 text-sm text-white/80">
              {[dict.rail.how1, t(dict.rail.how2, { price }), dict.rail.how3].map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
            <Link href={`/${locale}/how`} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-white hover:underline">
              {dict.rail.howMore} <ArrowRight width={16} height={16} />
            </Link>
          </section>
        </aside>
      </div>

      <GiveDialog target={target} onClose={() => setTargetId(null)} locale={locale} dict={dict} unitPrice={unitPrice} maxPower={maxPower} sandbox={sandbox} />
    </>
  )
}
