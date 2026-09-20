"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminLocked, endSession, startSession, verifyPassword } from "@/lib/auth"
import { db } from "@/lib/db"
import { allow, clientIp } from "@/lib/rate-limit"

export type LoginState = { error?: string; email?: string }

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase()
  const password = String(form.get("password") ?? "")
  if (adminLocked())
    return { email, error: "Admin is locked: this deployment still uses the secrets from the public .env. Set SESSION_SECRET and ADMIN_PASSWORD in the hosting environment and redeploy." }
  if (!allow(`login:${clientIp(await headers())}`, 8, 10 * 60_000))
    return { email, error: "Too many attempts. Wait ten minutes and try again." }

  const admin = await db.admin.findUnique({ where: { email } })
  // Same message for both cases so the form does not reveal which emails exist.
  if (!admin || !(await verifyPassword(password, admin.passwordHash)))
    return { email, error: "That email and password do not match." }

  await startSession(admin.id)
  redirect("/admin")
}

export async function logout() {
  await endSession()
  redirect("/admin/login")
}
