"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Region, UniversityType } from "@/generated/prisma"
import { audit, requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { normalizeDomain } from "@/lib/domain"
import { OrderError, newPublicId, refundOrder, settleOrder } from "@/lib/orders"
import { SETTING_DEFAULTS, saveSettings } from "@/lib/settings"

// Every action ends in a redirect carrying ?ok= or ?error=, which the page
// renders as a notice. It survives reloads and needs no client state.
function back(path: string, kind: "ok" | "error", message: string): never {
  revalidatePath("/", "layout")
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`)
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const UniversityInput = z.object({
  shortName: z.string().trim().min(2, "Short name needs at least 2 characters").max(24),
  nameEn: z.string().trim().min(3, "English name is required").max(160),
  nameUz: z.string().trim().min(3, "Uzbek name is required").max(160),
  nameRu: z.string().trim().min(3, "Russian name is required").max(160),
  website: z.string().trim().min(1, "Website is required"),
  region: z.enum(Region),
  type: z.enum(UniversityType),
})

export async function saveUniversity(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id") ?? "")
  const here = id ? `/admin/universities/${id}` : "/admin/universities/new"
  // On a failed create, send the typed values back so nothing has to be retyped.
  const keep = id ? "" : `?${new URLSearchParams([...form.entries()].filter(([k, v]) => typeof v === "string" && k !== "id") as [string, string][])}`

  const parsed = UniversityInput.safeParse(Object.fromEntries(form))
  if (!parsed.success) back(here + keep, "error", parsed.error.issues[0].message)
  const { website, ...data } = parsed.data
  const domain = normalizeDomain(website)
  if (!domain) back(here + keep, "error", "Website must look like “tuit.uz”.")

  const clash = await db.university.findFirst({ where: { domain, NOT: id ? { id } : undefined }, select: { shortName: true } })
  if (clash) back(here + keep, "error", `${domain} already belongs to ${clash.shortName}.`)

  if (id) {
    await db.university.update({ where: { id }, data: { ...data, domain } })
    await audit(admin.id, "university.update", data.shortName)
    back(here, "ok", "Saved.")
  }

  let slug = slugify(data.shortName) || slugify(domain)
  if (await db.university.findUnique({ where: { slug } })) slug = `${slug}-${slugify(domain.split(".")[0])}`
  if (await db.university.findUnique({ where: { slug } })) back(here + keep, "error", "A university with this short name already exists.")
  const created = await db.university.create({ data: { ...data, domain, slug } })
  await audit(admin.id, "university.create", data.shortName)

  const suggestionId = String(form.get("suggestionId") ?? "")
  if (suggestionId) {
    await db.suggestion.updateMany({ where: { id: suggestionId, status: "PENDING" }, data: { status: "APPROVED", decidedAt: new Date() } })
    await audit(admin.id, "suggestion.approve", data.shortName)
  }
  back(`/admin/universities/${created.id}`, "ok", `${data.shortName} is now on the board with 0 POWER.`)
}

export async function setHidden(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id"))
  const hidden = form.get("hidden") === "1"
  const u = await db.university.update({ where: { id }, data: { hidden } })
  await audit(admin.id, hidden ? "university.hide" : "university.show", u.shortName)
  back(`/admin/universities/${id}`, "ok", hidden ? "Hidden from the public board. POWER and orders are kept." : "Visible on the board again.")
}

export async function deleteUniversity(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id"))
  // Money history is never deleted: a university with orders can only be hidden.
  if (await db.order.count({ where: { universityId: id } }))
    back(`/admin/universities/${id}`, "error", "This university has orders, so it cannot be deleted. Hide it instead.")
  const u = await db.university.delete({ where: { id } })
  await audit(admin.id, "university.delete", u.shortName)
  back("/admin/universities", "ok", `${u.shortName} deleted.`)
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"]
const LOGO_MAX = 300 * 1024

export async function uploadLogo(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id"))
  const here = `/admin/universities/${id}`
  const file = form.get("logo")
  if (!(file instanceof File) || file.size === 0) back(here, "error", "Choose an image first.")
  if (!LOGO_TYPES.includes(file.type)) back(here, "error", "Use a PNG, JPEG or WebP image.")
  if (file.size > LOGO_MAX) back(here, "error", `That file is ${Math.round(file.size / 1024)} KB. The limit is 300 KB — a 256×256 logo is plenty.`)

  const data = new Uint8Array(await file.arrayBuffer())
  await db.$transaction([
    db.logo.upsert({ where: { universityId: id }, create: { universityId: id, mime: file.type, data }, update: { mime: file.type, data } }),
    db.university.update({ where: { id }, data: { logoPath: Date.now().toString(36) } }),
  ])
  await audit(admin.id, "university.logo", id)
  back(here, "ok", "Logo updated.")
}

export async function removeLogo(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id"))
  await db.$transaction([db.logo.deleteMany({ where: { universityId: id } }), db.university.update({ where: { id }, data: { logoPath: null } })])
  await audit(admin.id, "university.logo.remove", id)
  back(`/admin/universities/${id}`, "ok", "Logo removed. The monogram is shown instead.")
}

/** POWER given without a payment: prizes, corrections. Recorded as an order with amount 0 so it shows up everywhere orders do. */
export async function grantPower(form: FormData) {
  const admin = await requireAdmin()
  const id = String(form.get("id"))
  const here = `/admin/universities/${id}`
  const power = Number(form.get("power"))
  const reason = String(form.get("reason") ?? "").trim()
  if (!Number.isInteger(power) || power < 1 || power > SETTING_DEFAULTS.maxPowerPerOrder) back(here, "error", "POWER must be a whole number of at least 1.")
  if (reason.length < 3) back(here, "error", "Say why this POWER is being granted — it goes in the audit log.")

  const order = await db.order.create({
    data: { publicId: newPublicId(), universityId: id, power, unitPriceUzs: 0, amountUzs: 0, provider: "admin", expiresAt: new Date(Date.now() + 60_000) },
  })
  await settleOrder({ publicId: order.publicId, providerRef: `grant_${order.publicId}`, amountUzs: 0 })
  await audit(admin.id, "power.grant", order.publicId, `${power} POWER — ${reason}`)
  back(here, "ok", `Granted ${power} POWER. To take it back, refund order ${order.publicId}.`)
}

export async function orderAction(form: FormData) {
  const admin = await requireAdmin()
  const publicId = String(form.get("publicId"))
  const action = String(form.get("action"))
  const here = String(form.get("back") || "/admin/orders")
  try {
    if (action === "confirm") {
      const order = await db.order.findUniqueOrThrow({ where: { publicId } })
      if (order.status === "REFUNDED") back(here, "error", "A refunded order cannot be confirmed again.")
      await settleOrder({ publicId, providerRef: `manual_${publicId}`, amountUzs: order.amountUzs })
      await audit(admin.id, "order.confirm", publicId)
      back(here, "ok", `Order ${publicId} marked as paid and credited.`)
    }
    if (action === "refund") {
      await refundOrder(publicId)
      await audit(admin.id, "order.refund", publicId)
      back(here, "ok", `Order ${publicId} refunded. Its POWER was removed; return the money through the provider.`)
    }
    if (action === "mute" || action === "unmute") {
      await db.order.update({ where: { publicId }, data: { muted: action === "mute" } })
      await audit(admin.id, `order.${action}`, publicId)
      back(here, "ok", action === "mute" ? "Name and message hidden from public pages." : "Name and message visible again.")
    }
  } catch (e) {
    if (e instanceof OrderError) back(here, "error", e.code === "not_refundable" ? "Only paid orders can be refunded." : `Could not do that: ${e.code}.`)
    throw e
  }
  back(here, "error", "Unknown action.")
}

export async function rejectSuggestion(form: FormData) {
  const admin = await requireAdmin()
  const s = await db.suggestion.update({ where: { id: String(form.get("id")) }, data: { status: "REJECTED", decidedAt: new Date() } })
  await audit(admin.id, "suggestion.reject", s.domain)
  back("/admin/suggestions", "ok", `Rejected ${s.name}.`)
}

const SettingsInput = z.object({
  unitPriceUzs: z.coerce.number().int().min(100, "Price must be at least 100 UZS").max(10_000_000),
  orderTtlMinutes: z.coerce.number().int().min(5, "Give people at least 5 minutes to pay").max(24 * 60),
  maxPowerPerOrder: z.coerce.number().int().min(1).max(200_000, "Above 200 000 POWER the amount no longer fits the database column"),
})

export async function updateSettings(form: FormData) {
  const admin = await requireAdmin()
  const parsed = SettingsInput.safeParse(Object.fromEntries(form))
  if (!parsed.success) back("/admin/settings", "error", parsed.error.issues[0].message)
  if (parsed.data.unitPriceUzs * parsed.data.maxPowerPerOrder > 2_000_000_000)
    back("/admin/settings", "error", "Price × max POWER must stay under 2 000 000 000 UZS per order.")
  await saveSettings(parsed.data)
  await audit(admin.id, "settings.update", "settings", JSON.stringify(parsed.data))
  back("/admin/settings", "ok", "Saved. New orders use these values; existing orders keep theirs.")
}
