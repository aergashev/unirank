/**
 * Reduce whatever a person pastes ("https://www.TUIT.uz/en/about", "tuit.uz ")
 * to a bare host, or null when it is not a plausible site.
 */
export function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`)
    const host = url.hostname.replace(/^www\./, "")
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null
    return host
  } catch {
    return null
  }
}
