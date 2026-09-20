"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { normalizeDomain } from "@/lib/domain"
import { allow, clientIp } from "@/lib/rate-limit"

export type SuggestState =
  | { status: "idle" }
  | { status: "done"; name: string }
  | { status: "exists"; slug: string; shortName: string; values: Values }
  | { status: "error"; values: Values; errors: { name?: true; website?: true; rate?: true; pending?: true } }

type Values = { name: string; website: string; contact: string }

export async function suggestUniversity(_: SuggestState, form: FormData): Promise<SuggestState> {
  const values: Values = {
    name: String(form.get("name") ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
    website: String(form.get("website") ?? "").trim().slice(0, 200),
    contact: String(form.get("contact") ?? "").trim().slice(0, 120),
  }
  const domain = normalizeDomain(values.website)
  const errors: Extract<SuggestState, { status: "error" }>["errors"] = {}
  if (values.name.length < 3) errors.name = true
  if (!domain) errors.website = true
  if (errors.name || errors.website || !domain) return { status: "error", values, errors }

  const listed = await db.university.findFirst({ where: { domain, hidden: false }, select: { slug: true, shortName: true } })
  if (listed) return { status: "exists", ...listed, values }

  if (await db.suggestion.findFirst({ where: { domain, status: "PENDING" } }))
    return { status: "error", values, errors: { pending: true } }

  if (!allow(`suggest:${clientIp(await headers())}`, 5, 60 * 60_000))
    return { status: "error", values, errors: { rate: true } }

  await db.suggestion.create({ data: { name: values.name, website: values.website, domain, contact: values.contact || null } })
  return { status: "done", name: values.name }
}
