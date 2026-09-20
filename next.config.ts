import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image; Vercel ignores it.
  output: "standalone",
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
