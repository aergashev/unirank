import Link from "next/link"
import { Wordmark } from "@/components/brand"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { logout } from "../login/actions"
import { AdminNav } from "./nav"

export const dynamic = "force-dynamic"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const pending = await db.suggestion.count({ where: { status: "PENDING" } })
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-line p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-r">
        <Link href="/admin" className="mb-4 px-2 pt-1"><Wordmark /></Link>
        <AdminNav pendingSuggestions={pending} />
        <div className="mt-4 border-t border-line pt-4 text-sm lg:mt-auto">
          <p className="truncate px-2 text-ink-3">{admin.email}</p>
          <div className="mt-1 flex lg:flex-col">
            <Link href="/" className="rounded-lg px-2 py-2 font-medium text-ink-2 hover:bg-white">View site ↗</Link>
            <form action={logout}><button className="w-full rounded-lg px-2 py-2 text-left font-medium text-ink-2 hover:bg-white">Sign out</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 pb-16 sm:p-8">{children}</main>
    </div>
  )
}
