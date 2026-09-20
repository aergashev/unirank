import { type Dictionary, type Locale, formatDay, formatNumber, t } from "@/lib/i18n"

/** Daily POWER for the last 30 days as plain bars. Server-rendered, no chart library needed. */
export function PowerChart({ days, locale, dict }: { days: { date: Date; power: number }[]; locale: Locale; dict: Dictionary }) {
  const max = Math.max(...days.map((d) => d.power))
  if (max === 0) return <p className="py-6 text-sm text-ink-3">{dict.uni.chartEmpty}</p>
  return (
    <figure>
      <div className="flex h-32 items-end gap-[3px]" role="img" aria-label={`${dict.uni.chart}: ${formatNumber(days.reduce((s, d) => s + d.power, 0))} POWER`}>
        {days.map((d) => (
          <div key={d.date.toISOString()} className="group relative flex h-full flex-1 items-end" title={t(dict.uni.chartDay, { date: formatDay(d.date, locale), n: formatNumber(d.power) })}>
            <div className={`w-full rounded-t-[3px] ${d.power ? "bg-brand group-hover:bg-brand-strong" : "bg-line"}`} style={{ height: d.power ? `${Math.max(6, (d.power / max) * 100)}%` : 2 }} />
          </div>
        ))}
      </div>
      <figcaption className="num mt-2 flex justify-between text-xs text-ink-3">
        <span>{formatDay(days[0].date, locale)}</span>
        <span>{formatDay(days[days.length - 1].date, locale)}</span>
      </figcaption>
    </figure>
  )
}
