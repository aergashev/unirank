import type { Metadata } from "next"
import { Onest } from "next/font/google"
import "../globals.css"

const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-onest", display: "swap" })

export const metadata: Metadata = { title: { default: "Admin — UniRank", template: "%s — UniRank admin" }, robots: { index: false, follow: false } }

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={onest.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
