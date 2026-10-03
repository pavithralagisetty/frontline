import { useStore } from '../state/store'

// Phase 1: header and empty state. Incident cards arrive in Phase 2.
export function TriagePanel() {
  const { config } = useStore().state

  return (
    <section className="xl:col-span-7 flex flex-col gap-space-lg min-w-0">
      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-label-sm uppercase tracking-wider text-outline">Agent triage</span>
            <span className="text-body-sm text-on-surface-variant">No incidents yet</span>
          </div>
          {config && (
            <span className="font-mono text-[11px] text-outline">
              Engine: {config.engine} ({config.local ? 'local' : 'cloud'} · {config.agent_mode} mode)
            </span>
          )}
        </div>
        <div className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-outline">monitoring</span>
          <span className="text-body-md">Watching Error lines. New incidents will appear here.</span>
        </div>
      </div>
    </section>
  )
}
