import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Alert, ArrowRight, Bolt, Check, Clock } from "@/components/icons"
import { Share } from "@/components/share"
import { UniLogo } from "@/components/uni-logo"
import { db } from "@/lib/db"
import { formatDateTime, formatNumber, formatUzs, getDictionary, hasLocale, t } from "@/lib/i18n"
import { expireStaleOrders } from "@/lib/orders"
import { getProvider } from "@/lib/payments"
import { getBoard } from "@/lib/ranking"

export const dynamic = "force-dynamic"
// Receipt links are private to whoever holds them.
export const metadata: Metadata = { robots: { index: false } }

export default async function OrderPage({ params }: PageProps<"/[lang]/orders/[id]">) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()
  await expireStaleOrders()
  const order = await db.order.findUnique({ where: { publicId: id }, include: { university: true } })
  if (!order) notFound()
  const dict = getDictionary(lang)
  const uni = order.university
  const retryHref = `/${lang}/u/${uni.slug}?power=${order.power}`

  const receipt = (
    <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
      <dt className="text-ink-3">{dict.order.id}</dt><dd className="num text-right font-semibold tracking-wider">{order.publicId}</dd>
      <dt className="text-ink-3">{dict.order.amount}</dt><dd className="num text-right font-semibold">{formatUzs(order.amountUzs, dict)}</dd>
      <dt className="text-ink-3">{dict.order.date}</dt><dd className="text-right font-semibold">{formatDateTime(order.paidAt ?? order.createdAt, lang)}</dd>
    </dl>
  )

  if (order.status === "PAID") {
    // Live position, not the snapshot: the receipt stays truthful when reopened later.
    const board = await getBoard()
    const now = board.find((r) => r.id === uni.id)
    const above = now && now.rank > 1 ? board[now.rank - 2] : null
    const moved = order.rankBefore && order.rankAfter && order.rankAfter < order.rankBefore
    return (
      <Shell>
        <div className="rise text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-up-soft text-up"><Check width={32} height={32} /></span>
          <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {t(dict.order.paidTitle, { n: formatNumber(order.power), uni: uni.shortName })}
          </h1>
          <p className="mt-2 text-ink-2">
            {moved
              ? t(dict.order.paidRankUp, { from: order.rankBefore!, to: order.rankAfter!, places: order.rankBefore! - order.rankAfter! })
              : t(dict.order.paidRankSame, { rank: order.rankAfter ?? now?.rank ?? "—" })}
          </p>
        </div>

        {now && (
          <Link href={`/${lang}/u/${uni.slug}`} className="mt-6 flex items-center gap-3 rounded-control bg-paper p-4 hover:bg-brand-soft">
            <UniLogo slug={uni.slug} shortName={uni.shortName} logoPath={uni.logoPath} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-ink-3">{dict.order.nowTotal}</span>
              <span className="num flex items-center gap-1 text-lg font-extrabold"><Bolt width={16} height={16} className="text-bolt" />{formatNumber(now.power)} · №{now.rank}</span>
              <span className="block text-sm text-ink-2">
                {above ? t(dict.order.nextGap, { rank: above.rank, n: formatNumber(above.power - now.power + 1) }) : dict.order.isFirst}
              </span>
            </span>
          </Link>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-ink-2">{dict.order.share}</p>
          <Share path={`/${lang}/u/${uni.slug}`} text={t(dict.order.shareText, { n: formatNumber(order.power), uni: uni.shortName })} labels={{ telegram: "Telegram", copy: dict.uni.copy, copied: dict.uni.copied }} />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href={`/${lang}`} className="btn-primary flex-1">{dict.order.toBoard} <ArrowRight width={18} height={18} /></Link>
          <Link href={`/${lang}/u/${uni.slug}`} className="btn-quiet flex-1">{dict.order.more}</Link>
        </div>
        {receipt}
      </Shell>
    )
  }

  const state =
    order.status === "PENDING"
      ? { tone: "bg-bolt-soft text-bolt", Icon: Clock, title: dict.order.pendingTitle, text: t(dict.order.pendingText, { time: formatDateTime(order.expiresAt, lang) }), href: getProvider().checkoutUrl(order), cta: dict.order.continue }
      : order.status === "REFUNDED"
        ? { tone: "bg-paper text-ink-2", Icon: Check, title: dict.order.refundedTitle, text: dict.order.refundedText, href: `/${lang}`, cta: dict.order.toBoard }
        : order.status === "EXPIRED"
          ? { tone: "bg-paper text-ink-2", Icon: Clock, title: dict.order.expiredTitle, text: dict.order.expiredText, href: retryHref, cta: dict.order.retry }
          : { tone: "bg-down-soft text-down", Icon: Alert, title: dict.order.failedTitle, text: dict.order.failedText, href: retryHref, cta: dict.order.retry }

  return (
    <Shell>
      <div className="text-center">
        <span className={`mx-auto grid size-16 place-items-center rounded-full ${state.tone}`}><state.Icon width={30} height={30} /></span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{state.title}</h1>
        <p className="mt-2 text-ink-2">{state.text}</p>
        <p className="mt-1 text-sm text-ink-3">{uni.shortName} · {formatNumber(order.power)} POWER</p>
      </div>
      <Link href={state.href} className="btn-primary mt-6 w-full">{state.cta}</Link>
      {receipt}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md pt-10 sm:pt-16"><div className="card p-6 sm:p-8">{children}</div></div>
}
