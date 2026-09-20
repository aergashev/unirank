import { notFound } from "next/navigation"
import { Board } from "@/components/board"
import { getHomeData } from "@/lib/home-data"
import { getDictionary, hasLocale } from "@/lib/i18n"
import { testGatewayEnabled } from "@/lib/payments/test-gateway"
import { getSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const [initial, settings] = await Promise.all([getHomeData(), getSettings()])
  return (
    <Board
      initial={initial}
      locale={lang}
      dict={getDictionary(lang)}
      unitPrice={settings.unitPriceUzs}
      maxPower={settings.maxPowerPerOrder}
      sandbox={testGatewayEnabled()}
    />
  )
}
