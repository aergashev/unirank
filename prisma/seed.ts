import "dotenv/config"
import { randomBytes, scryptSync } from "node:crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, type Region } from "../generated/prisma"
import { UNIVERSITIES } from "./universities"

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

async function main() {
  // Insert-only: re-running the seed never overwrites what admins have edited.
  let added = 0
  const base = Date.now()
  for (const [i, [shortName, domain, region, type, nameEn, nameUz, nameRu]] of UNIVERSITIES.entries()) {
    const exists = await db.university.findFirst({ where: { OR: [{ domain }, { slug: slugify(shortName) }] } })
    if (exists) continue
    await db.university.create({
      data: {
        slug: slugify(shortName), shortName, domain, region: region as Region, type, nameEn, nameUz, nameRu,
        // Distinct timestamps make the list order the tie-break at 0 POWER.
        createdAt: new Date(base + i),
      },
    })
    added++
  }
  console.log(`universities: ${added} added, ${UNIVERSITIES.length - added} already present`)

  // The env admin's password follows ADMIN_PASSWORD on every run, so rotating
  // the variable and redeploying is all it takes to change it.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    const salt = randomBytes(16)
    const passwordHash = `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`
    await db.admin.upsert({ where: { email }, create: { email, passwordHash }, update: { passwordHash } })
    console.log(`admin: ${email} synced`)
  }
}

main().finally(() => db.$disconnect())
