import "server-only"
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SignJWT, jwtVerify } from "jose"
import { db } from "./db"

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const COOKIE = "unirank_admin"
const MAX_AGE = 60 * 60 * 12

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const hash = await scrypt(password, Buffer.from(saltHex, "hex"), 64)
  const expected = Buffer.from(hashHex, "hex")
  return hash.length === expected.length && timingSafeEqual(hash, expected)
}

function key() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters")
  return new TextEncoder().encode(s)
}

export async function startSession(adminId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key())
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http://"),
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

/** Set at build time by next.config.ts when a deployment still runs on the public, committed secrets. */
export const adminLocked = () => process.env.ADMIN_LOCKED === "1"

export async function currentAdmin() {
  if (adminLocked()) return null
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    if (!payload.sub) return null
    return db.admin.findUnique({ where: { id: payload.sub }, select: { id: true, email: true } })
  } catch {
    return null
  }
}

/** For admin pages and actions: the signed-in admin, or a trip to the login page. */
export async function requireAdmin() {
  const admin = await currentAdmin()
  if (!admin) redirect("/admin/login")
  return admin
}

export async function audit(adminId: string, action: string, target: string, detail?: string) {
  await db.auditLog.create({ data: { adminId, action, target, detail } })
}
