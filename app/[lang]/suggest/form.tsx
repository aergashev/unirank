"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Alert, ArrowRight, Check } from "@/components/icons"
import { type Dictionary, type Locale, t } from "@/lib/i18n"
import { type SuggestState, suggestUniversity } from "./actions"

export function SuggestForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, action, pending] = useActionState<SuggestState, FormData>(suggestUniversity, { status: "idle" })
  const d = dict.suggest

  if (state.status === "done")
    return (
      <div className="rise text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-up-soft text-up"><Check width={28} height={28} /></span>
        <h2 className="mt-4 text-xl font-extrabold">{d.doneTitle}</h2>
        <p className="mt-2 text-ink-2">{t(d.doneText, { name: state.name })}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/${locale}`} className="btn-primary">{dict.how.cta}</Link>
          {/* A full navigation resets the action state to a clean form. */}
          <a href={`/${locale}/suggest`} className="btn-quiet">{d.another}</a>
        </div>
      </div>
    )

  const values = state.status === "idle" ? { name: "", website: "", contact: "" } : state.values
  const errors = state.status === "error" ? state.errors : {}

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "exists" && (
        <p role="status" className="rounded-control bg-brand-soft p-4 text-sm text-navy">
          {d.exists}{" "}
          <Link href={`/${locale}/u/${state.slug}`} className="inline-flex items-center gap-1 font-bold underline">{state.shortName} <ArrowRight width={14} height={14} /></Link>
        </p>
      )}
      {(errors.rate || errors.pending) && (
        <p role="alert" className="flex gap-2 rounded-control bg-down-soft p-3 text-sm text-down">
          <Alert width={18} height={18} className="mt-px shrink-0" /> {errors.rate ? d.errors.rate : d.pending}
        </p>
      )}
      <Field id="name" label={d.name} defaultValue={values.name} error={errors.name ? d.errors.name : undefined} autoComplete="organization" />
      <Field id="website" label={d.website} hint={d.websiteHint} defaultValue={values.website} error={errors.website ? d.errors.website : undefined} inputMode="url" autoCapitalize="none" />
      <Field id="contact" label={d.contact} hint={d.contactHint} defaultValue={values.contact} />
      <button type="submit" disabled={pending} className="btn-primary h-13 text-base">{pending ? d.sending : d.submit}</button>
    </form>
  )
}

function Field({ id, label, hint, error, ...input }: { id: string; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-2">{label}</label>
      <input id={id} name={id} className="field" aria-invalid={!!error} aria-describedby={`${id}-help`} {...input} />
      <p id={`${id}-help`} className={`mt-1.5 text-xs ${error ? "text-down" : "text-ink-3"}`}>{error ?? hint}</p>
    </div>
  )
}
