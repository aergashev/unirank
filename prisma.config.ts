// Prisma 7 moved the connection URL out of the schema — the datasource block
// declares only the provider, and Migrate reads the URL from here.
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations need a direct connection; Neon exposes one next to its pooled URL.
  datasource: { url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"] },
})
