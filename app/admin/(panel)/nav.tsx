"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/universities", label: "Universities" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit log" },
]

export function AdminNav({ pendingSuggestions }: { pendingSuggestions: number }) {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-10 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 text-[0.95rem] font-medium text-ink-2 hover:bg-white aria-[current=page]:bg-white aria-[current=page]:font-bold aria-[current=page]:text-ink aria-[current=page]:shadow-card"
          >
            {item.label}
            {item.href === "/admin/suggestions" && pendingSuggestions > 0 && (
              <span className="num rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{pendingSuggestions}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
