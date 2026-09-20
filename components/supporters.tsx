"use client"

import { type Dictionary, formatNumber, timeAgo } from "@/lib/i18n"
import { Bolt } from "./icons"
import { useNow } from "./use-now"

type Supporter = { id: string; power: number; name: string | null; message: string | null; at: string }

export function Supporters({ items, dict }: { items: Supporter[]; dict: Dictionary }) {
  const now = useNow()
  if (items.length === 0) return <p className="text-sm text-ink-3">{dict.uni.recentEmpty}</p>
  return (
    <ul className="divide-y divide-line">
      {items.map((s) => (
        <li key={s.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{s.name ?? <span className="text-ink-2">{dict.uni.anonymous}</span>}</p>
            {s.message && <p className="mt-0.5 break-words text-sm text-ink-2">{s.message}</p>}
            <p className="mt-0.5 text-xs text-ink-3">{now ? timeAgo(s.at, dict, now) : " "}</p>
          </div>
          <p className="num flex shrink-0 items-center gap-1 self-start font-bold"><Bolt width={14} height={14} className="text-bolt" />+{formatNumber(s.power)}</p>
        </li>
      ))}
    </ul>
  )
}
