"use client"

import { useActionState } from "react"
import { type LoginState, login } from "./actions"

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p role="alert" className="rounded-control bg-down-soft p-3 text-sm text-down">{state.error}</p>}
      <label className="block text-sm font-semibold text-ink-2">
        Email
        <input name="email" type="email" required autoComplete="username" autoFocus defaultValue={state.email} className="field mt-1.5 font-normal" />
      </label>
      <label className="block text-sm font-semibold text-ink-2">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="field mt-1.5 font-normal" />
      </label>
      <button disabled={pending} className="btn-primary mt-1 h-12">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  )
}
