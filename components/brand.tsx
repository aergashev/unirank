/** Three rising bars: a podium and a bar chart at once. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect width="28" height="28" rx="8" fill="var(--color-brand)" />
      <rect x="6" y="15" width="4" height="7" rx="1.5" fill="#fff" opacity=".55" />
      <rect x="12" y="6" width="4" height="16" rx="1.5" fill="#fff" />
      <rect x="18" y="11" width="4" height="11" rx="1.5" fill="#fff" opacity=".8" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-[1.15rem] font-extrabold tracking-tight">
      <BrandMark />
      <span>
        Uni<span className="text-brand">Rank</span>
      </span>
    </span>
  )
}
