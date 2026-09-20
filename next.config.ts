import { existsSync, readFileSync } from "node:fs"
import type { NextConfig } from "next"

const onVercel = !!process.env.VERCEL

// .env is committed to a public repository, so its SESSION_SECRET is public.
// On Vercel the real one must come from the project's environment variables;
// if the value in use is still the committed one, anyone could forge an admin
// session — so the admin panel is locked for that build instead.
function usesCommittedSecret() {
  if (!existsSync(".env")) return false
  const committed = readFileSync(".env", "utf8").match(/^SESSION_SECRET=(.*)$/m)?.[1]?.trim()
  return !!committed && committed === process.env.SESSION_SECRET
}

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image. Vercel has its own output
  // pipeline and fails the build if this is set.
  output: onVercel ? undefined : "standalone",
  env: { ADMIN_LOCKED: onVercel && usesCommittedSecret() ? "1" : "" },
  // Logo uploads go through a server action.
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }]
  },
}

export default nextConfig
