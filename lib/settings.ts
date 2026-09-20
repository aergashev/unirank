import "server-only"
import { db } from "./db"

/** Admin-editable numbers. Anything missing from the table uses the default. */
export const SETTING_DEFAULTS = {
  unitPriceUzs: 10_000,
  // No upper limit is a product decision ("anyone can add any amount"); this
  // cap only keeps amountUzs inside a 32-bit integer column.
  maxPowerPerOrder: 200_000,
  orderTtlMinutes: 30,
} as const

export type Settings = { -readonly [K in keyof typeof SETTING_DEFAULTS]: number }

export async function getSettings(): Promise<Settings> {
  const rows = await db.setting.findMany()
  const stored = new Map(rows.map((r) => [r.key, Number(r.value)]))
  const out = { ...SETTING_DEFAULTS } as Settings
  for (const key of Object.keys(out) as (keyof Settings)[]) {
    const v = stored.get(key)
    if (v !== undefined && Number.isFinite(v) && v > 0) out[key] = v
  }
  return out
}

export async function saveSettings(patch: Partial<Settings>) {
  await db.$transaction(
    Object.entries(patch).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      }),
    ),
  )
}
