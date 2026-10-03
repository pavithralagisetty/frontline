import { useEffect, useState } from 'react'

type Health = { status: string; engine: string; agent_mode: string }

// Phase 0 placeholder: proves the frontend can reach the backend.
export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div className="min-h-screen px-space-lg py-space-xl">
      <div className="flex items-center gap-space-sm">
        <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">hub</span>
        </div>
        <span className="text-headline-sm text-on-surface tracking-tight">Log Triage Agent</span>
      </div>
      <div className="mt-space-lg bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] max-w-md">
        <span className="text-label-sm uppercase tracking-wider text-outline">Backend</span>
        {health && (
          <p className="mt-2 font-mono text-mono-code text-on-surface">
            {health.status} · engine {health.engine} · mode {health.agent_mode}
          </p>
        )}
        {error && <p className="mt-2 font-mono text-mono-code text-error">Not reachable: {error}</p>}
        {!health && !error && <p className="mt-2 text-body-sm text-on-surface-variant">Connecting…</p>}
      </div>
    </div>
  )
}
