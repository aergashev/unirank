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

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (email && password && !(await db.admin.findUnique({ where: { email } }))) {
    const salt = randomBytes(16)
    const hash = scryptSync(password, salt, 64)
    await db.admin.create({ data: { email, passwordHash: `${salt.toString("hex")}:${hash.toString("hex")}` } })
    console.log(`admin: created ${email}`)
  }
}

main().finally(() => db.$disconnect())
