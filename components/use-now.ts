"use client"

import { useSyncExternalStore } from "react"

// One shared minute clock. Null on the server and during hydration, so
// relative times ("2 min ago") never cause a server/client mismatch.
let current = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  current = Date.now()
  timer ??= setInterval(() => {
    current = Date.now()
    listeners.forEach((l) => l())
  }, 60_000)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

export const useNow = () => useSyncExternalStore<number | null>(subscribe, () => current, () => null)
