import type { Metadata } from "next"
import { Onest } from "next/font/google"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LOCALES, getDictionary, hasLocale } from "@/lib/i18n"
import "../globals.css"

const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-onest", display: "swap" })

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = getDictionary(lang)
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300"),
    title: { default: dict.meta.title, template: "%s — UniRank" },
    description: dict.meta.description,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) },
    openGraph: { title: dict.meta.title, description: dict.meta.description, siteName: "UniRank", type: "website" },
  }
}

export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = getDictionary(lang)
  return (
    <html lang={lang} className={onest.variable}>
      <body className="flex min-h-dvh flex-col">
        <Header locale={lang} dict={dict} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
        <Footer locale={lang} dict={dict} />
      </body>
    </html>
  )
}
