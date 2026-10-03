export function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-GB', { hour12: false })
}

// "payments-service" -> "payments" to keep tags and chips compact.
export function shortService(service: string): string {
  return service.replace(/-service$/, '')
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatSeconds(s: number | null): string {
  if (s === null) return '—'
  return s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}
