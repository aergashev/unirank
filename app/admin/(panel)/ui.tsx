import type { OrderStatus } from "@/generated/prisma"

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-2">{sub}</p>}
      </div>
      {children}
    </header>
  )
}

const STATUS: Record<OrderStatus, string> = {
  PAID: "bg-up-soft text-up",
  PENDING: "bg-bolt-soft text-[#8a5a00]",
  FAILED: "bg-down-soft text-down",
  EXPIRED: "bg-paper text-ink-2",
  REFUNDED: "bg-brand-soft text-navy",
}

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[status]}`}>{status.toLowerCase()}</span>
}

export function Notice({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-5 rounded-control p-3 text-sm font-medium ${tone === "ok" ? "bg-up-soft text-up" : "bg-down-soft text-down"}`}>
      {children}
    </p>
  )
}

export const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-3"
export const td = "px-4 py-3 align-middle"

export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
export const when = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(d)
