import { useEffect, useState } from 'react'

// Current time in unix seconds, refreshed every `ms` for relative times and countdowns.
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function ago(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
