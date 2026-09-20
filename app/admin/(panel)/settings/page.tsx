import { testGatewayEnabled } from "@/lib/payments/test-gateway"
import { getSettings } from "@/lib/settings"
import { updateSettings } from "../actions"
import { Notice, PageTitle } from "../ui"

const label = "block text-sm font-semibold text-ink-2"
const hint = "mt-1 block text-xs font-normal text-ink-3"

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const [sp, s] = await Promise.all([searchParams, getSettings()])
  return (
    <>
      <PageTitle title="Settings" />
      {typeof sp.ok === "string" && <Notice tone="ok">{sp.ok}</Notice>}
      {typeof sp.error === "string" && <Notice tone="error">{sp.error}</Notice>}
      <form action={updateSettings} className="card flex max-w-lg flex-col gap-5 p-5 sm:p-6">
        <label className={label}>Price of 1 POWER, UZS
          <input name="unitPriceUzs" type="number" min={100} step={100} required defaultValue={s.unitPriceUzs} className="field num mt-1.5 font-normal" />
          <span className={hint}>Applies to new orders. Paid and pending orders keep the price they were created with.</span>
        </label>
        <label className={label}>Time to pay, minutes
          <input name="orderTtlMinutes" type="number" min={5} required defaultValue={s.orderTtlMinutes} className="field num mt-1.5 font-normal" />
          <span className={hint}>An unpaid order expires after this long.</span>
        </label>
        <label className={label}>Most POWER in one order
          <input name="maxPowerPerOrder" type="number" min={1} required defaultValue={s.maxPowerPerOrder} className="field num mt-1.5 font-normal" />
          <span className={hint}>A technical ceiling, not a product limit — people can place as many orders as they like.</span>
        </label>
        <div><button className="btn-primary">Save settings</button></div>
      </form>
      <section className="card mt-5 max-w-lg p-5 text-sm sm:p-6">
        <h2 className="font-bold">Payment provider</h2>
        <p className="mt-1 text-ink-2">
          {testGatewayEnabled()
            ? "Sandbox gateway. Checkout leads to a test page where the payment is approved or declined by hand; no money moves."
            : `Live provider: ${process.env.PAYMENT_PROVIDER}.`}
        </p>
        <p className="mt-2 text-xs text-ink-3">Set with the PAYMENT_PROVIDER environment variable. Providers are registered in lib/payments/index.ts.</p>
      </section>
    </>
  )
}
