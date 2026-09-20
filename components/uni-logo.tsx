// Monogram colours are picked from the name so a university keeps the same
// one everywhere; all pass contrast with white text.
const TONES = ["#2447f0", "#0b1b4d", "#0e7c86", "#7a3ff2", "#b4461f", "#0e8a45", "#a3195b", "#3b5168"]

function tone(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[h % TONES.length]
}

export function UniLogo({
  slug, shortName, logoPath, size = 44,
}: { slug: string; shortName: string; logoPath: string | null; size?: number }) {
  if (logoPath)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served from our own DB-backed route with its own caching
      <img
        src={`/logo/${slug}?v=${logoPath}`}
        alt=""
        width={size}
        height={size}
        // A rounded square, not a circle: round crests fit inside it and square marks keep their corners.
        className="shrink-0 rounded-[26%] border border-line bg-white object-contain"
        style={{ width: size, height: size, padding: size * 0.06 }}
      />
    )
  // Whole handle when it fits ("TSUE", "TSUL" must not both read "TS").
  const clean = shortName.replace(/[^\p{L}\p{N}]/gu, "")
  const letters = clean.length <= 4 ? clean : clean.slice(0, 3)
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-[26%] font-bold text-white"
      style={{ width: size, height: size, background: tone(slug), fontSize: size * (letters.length > 3 ? 0.26 : letters.length > 2 ? 0.3 : 0.36), letterSpacing: "-0.02em" }}
    >
      {letters}
    </span>
  )
}
