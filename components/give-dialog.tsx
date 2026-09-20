"use client"

import { useEffect, useRef } from "react"
import type { Dictionary, Locale } from "@/lib/i18n"
import { GiveForm, type GiveTarget } from "./give-form"
import { Close } from "./icons"
import { UniLogo } from "./uni-logo"

export type DialogTarget = GiveTarget & { slug: string; name: string; logoPath: string | null }

export function GiveDialog({
  target, onClose, locale, dict, unitPrice, maxPower, sandbox,
}: {
  target: DialogTarget | null
  onClose: () => void
  locale: Locale
  dict: Dictionary
  unitPrice: number
  maxPower: number
  sandbox: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  // The native <dialog> brings focus trapping, Esc and inert background for free.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (target && !el.open) el.showModal()
    if (!target && el.open) el.close()
  }, [target])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="give-title"
      className="m-auto w-[min(100%-1.5rem,27rem)] rounded-[24px] bg-white p-0 text-ink shadow-pop max-sm:mb-3 max-sm:mt-auto"
    >
      {target && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <UniLogo slug={target.slug} shortName={target.shortName} logoPath={target.logoPath} size={48} />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{dict.give.title}</p>
              <h2 id="give-title" className="truncate text-lg font-bold leading-tight">{target.name}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label={dict.give.close} className="-mr-2 grid size-11 place-items-center rounded-full text-ink-3 hover:bg-paper hover:text-ink">
              <Close />
            </button>
          </div>
          {/* Keyed so a different university always starts from a clean form. */}
          <GiveForm key={target.id} target={target} locale={locale} dict={dict} unitPrice={unitPrice} maxPower={maxPower} sandbox={sandbox} />
        </div>
      )}
    </dialog>
  )
}
