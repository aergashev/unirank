"use client"

import Link from "next/link"
import { type Dictionary, type Locale, formatNumber, t, timeAgo } from "@/lib/i18n"
import type { FeedItem } from "@/lib/ranking"
import { ArrowDown, ArrowUp, Bolt } from "./icons"
import { useNow } from "./use-now"

const LOOK = {
  POWER: { Icon: Bolt, cls: "bg-bolt-soft text-bolt" },
  RANK_UP: { Icon: ArrowUp, cls: "bg-up-soft text-up" },
  RANK_DOWN: { Icon: ArrowDown, cls: "bg-down-soft text-down" },
} as const

export function Feed({ items, locale, dict, empty }: { items: FeedItem[]; locale: Locale; dict: Dictionary; empty: string }) {
  const now = useNow()

  if (items.length === 0) return <p className="text-sm text-ink-3">{empty}</p>

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => {
        const { Icon, cls } = LOOK[item.type]
        const template = item.type === "POWER" ? dict.feed.power : item.type === "RANK_UP" ? dict.feed.up : dict.feed.down
        const [before, after] = t(template, { who: item.by ?? dict.feed.someone, n: formatNumber(item.amount), uni: "\u0000" }).split("\u0000")
        return (
          <li key={item.id} className="flex gap-3">
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${cls}`}><Icon width={16} height={16} /></span>
            <p className="min-w-0 text-sm leading-snug text-ink-2">
              {before}
              <Link href={`/${locale}/u/${item.slug}`} className="font-bold text-ink hover:text-brand">{item.shortName}</Link>
              {after}
              <span className="mt-0.5 block text-xs text-ink-3">{now ? timeAgo(item.at, dict, now) : " "}</span>
            </p>
          </li>
        )
      })}
    </ul>
  )
}
