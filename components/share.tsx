"use client"

import { useState } from "react"
import { Check, Copy, Telegram } from "./icons"

export function Share({ path, text, labels }: { path: string; text: string; labels: { telegram: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false)
  const url = () => new URL(path, window.location.origin).toString()
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-quiet"
        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(text)}`, "_blank", "noopener")}
      >
        <Telegram width={18} height={18} className="text-[#229ed9]" /> {labels.telegram}
      </button>
      <button
        type="button"
        className="btn-quiet"
        onClick={async () => {
          await navigator.clipboard.writeText(url()).catch(() => {})
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? <Check width={18} height={18} className="text-up" /> : <Copy width={18} height={18} />}
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  )
}
