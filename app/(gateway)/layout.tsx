import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = { title: "Test gateway", robots: { index: false } }

// Deliberately unbranded: this page plays the part of a third-party payment
// site, so it should not look like UniRank.
export default function GatewayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-[#eef0f3] p-4 font-mono text-[#1d2430]">{children}</body>
    </html>
  )
}
