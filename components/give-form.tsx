"use client"

import { useId, useState } from "react"
import { type Dictionary, type Locale, formatNumber, formatUzs, t } from "@/lib/i18n"
import { Alert, Bolt, Minus, Plus } from "./icons"

const PRESETS = [1, 5, 10, 50]

export type GiveTarget = {
  id: string
  shortName: string
  power: number
  rank: number
  /** Universities currently ranked above this one, best first. */
  ahead: { shortName: string; power: number; rank: number }[]
}

/** What a given amount would achieve — the one number people actually want before paying. */
function outlook(target: GiveTarget, amount: number, dict: Dictionary) {
  if (target.rank === 1) return t(dict.give.isFirst, { uni: target.shortName })
  const total = target.power + amount
  // Conservative on ties: only a strictly larger total is promised to overtake.
  const newRank = 1 + target.ahead.filter((u) => u.power >= total).length
  if (newRank < target.rank) return t(dict.give.willOvertake, { uni: target.shortName, rank: newRank })
  const next = target.ahead[target.ahead.length - 1]
  return t(dict.give.toOvertake, { uni: next.shortName, rank: next.rank, n: formatNumber(next.power - total + 1) })
}

export function GiveForm({
  target, locale, dict, unitPrice, maxPower, sandbox, initialAmount = 5, autoFocus = false,
}: {
  target: GiveTarget
  locale: Locale
  dict: Dictionary
  unitPrice: number
  maxPower: number
  sandbox: boolean
  initialAmount?: number
  autoFocus?: boolean
}) {
  const id = useId()
  const [raw, setRaw] = useState(String(initialAmount))
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [withMessage, setWithMessage] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Accept "1 000", "1,000", trailing spaces — anything that is clearly a number.
  const amount = Number(raw.replace(/[\s,. ]/g, ""))
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= maxPower
  const step = (delta: number) => setRaw(String(Math.min(maxPower, Math.max(1, (valid ? amount : 0) + delta))))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: target.id, power: amount, displayName: name, message: withMessage ? message : "", locale }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) return window.location.assign(data.url)
      const code = (data.error ?? "generic") as keyof Dictionary["give"]["errors"]
      setError(t(dict.give.errors[code] ?? dict.give.errors.generic, { max: formatNumber(maxPower) }))
    } catch {
      setError(dict.give.errors.generic)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-2">{dict.give.amount}</legend>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={valid && amount === p}
              onClick={() => setRaw(String(p))}
              className="num h-12 rounded-control border border-line-strong bg-white text-base font-bold transition-colors hover:border-ink-3 aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-stretch gap-2">
          <button type="button" onClick={() => step(-1)} aria-label={dict.give.minus} className="btn-quiet w-12 px-0"><Minus /></button>
          <div className="relative flex-1">
            <Bolt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bolt" width={18} height={18} />
            <input
              id={`${id}-amount`}
              aria-label={dict.give.custom}
              aria-invalid={!valid}
              aria-describedby={`${id}-outlook`}
              inputMode="numeric"
              autoComplete="off"
              autoFocus={autoFocus}
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^\d\s]/g, "").slice(0, 9))}
              onFocus={(e) => e.target.select()}
              className="field num pl-9 text-center text-lg font-bold"
            />
          </div>
          <button type="button" onClick={() => step(1)} aria-label={dict.give.plus} className="btn-quiet w-12 px-0"><Plus /></button>
        </div>
        <p id={`${id}-outlook`} className={`mt-2 min-h-5 text-sm ${valid ? "text-ink-2" : "text-down"}`}>
          {valid ? outlook(target, amount, dict) : t(dict.give.errors.amount, { max: formatNumber(maxPower) })}
        </p>
      </fieldset>

      <div>
        <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-semibold text-ink-2">{dict.give.name}</label>
        <input
          id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
          placeholder={dict.give.namePlaceholder} autoComplete="nickname" className="field"
        />
        <p className="mt-1.5 text-xs text-ink-3">{dict.give.nameHint}</p>
        {withMessage ? (
          <div className="mt-3">
            <label htmlFor={`${id}-msg`} className="mb-1.5 block text-sm font-semibold text-ink-2">{dict.give.message}</label>
            <textarea
              id={`${id}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140}
              placeholder={dict.give.messagePlaceholder} className="field" autoFocus
            />
          </div>
        ) : (
          <button type="button" onClick={() => setWithMessage(true)} className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Plus width={16} height={16} /> {dict.give.addMessage}
          </button>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-ink-2">{dict.give.total}</span>
          <span className="num text-xl font-extrabold">{valid ? formatUzs(amount * unitPrice, dict) : "—"}</span>
        </div>
        {error && (
          <p role="alert" className="mb-3 flex gap-2 rounded-control bg-down-soft p-3 text-sm text-down">
            <Alert className="mt-px shrink-0" width={18} height={18} /> {error}
          </p>
        )}
        <button type="submit" disabled={!valid || busy} className="btn-primary h-13 w-full text-base disabled:cursor-not-allowed">
          {busy ? dict.give.paying : t(dict.give.pay, { amount: valid ? formatUzs(amount * unitPrice, dict) : "" })}
        </button>
        {sandbox && <p className="mt-2 text-center text-xs text-ink-3">{dict.give.sandbox}</p>}
      </div>
    </form>
  )
}
