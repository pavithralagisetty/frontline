import { useMemo, useState } from 'react'
import { useNow } from '../lib/useNow'
import { useStore } from '../state/store'
import { IncidentCard } from './IncidentCard'
import { TeamSection } from './TeamSection'

const RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const

export function TriagePanel() {
  const { state, dispatch } = useStore()
  const { config } = state
  const now = useNow()
  const [showTeam, setShowTeam] = useState(false)

  // Open incidents first (worst severity, then newest); resolved ones sink to the bottom.
  const incidents = useMemo(
    () =>
      Object.values(state.incidents).sort((a, b) => {
        const ra = a.status === 'resolved' ? 1 : 0
        const rb = b.status === 'resolved' ? 1 : 0
        if (ra !== rb) return ra - rb
        const sa = a.severity ? RANK[a.severity] : -1
        const sb = b.severity ? RANK[b.severity] : -1
        if (sa !== sb) return sa - sb
        return b.first_seen - a.first_seen
      }),
    [state.incidents],
  )
  const active = incidents.filter((i) => i.status !== 'resolved').length

  return (
    <section className="xl:col-span-7 flex flex-col gap-space-lg min-w-0">
      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-label-sm uppercase tracking-wider text-outline">Agent triage</span>
            <span className="text-body-sm text-on-surface-variant">
              {active === 0
                ? 'No active incidents'
                : `${active} active ${active === 1 ? 'incident' : 'incidents'} identified by ${config?.local ? 'local' : 'cloud'} model`}
            </span>
          </div>
          {config && (
            <span className="font-mono text-[11px] text-outline">
              Engine: {config.engine} ({config.local ? 'local' : 'cloud'} · {config.agent_mode} mode)
            </span>
          )}
        </div>

        {incidents.length === 0 ? (
          <div className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px] text-outline">monitoring</span>
            <span className="text-body-md">Watching Error lines. New incidents will appear here.</span>
          </div>
        ) : (
          <div className={`flex flex-col gap-space-sm ${showTeam ? 'max-h-[calc(100vh-22rem)]' : 'max-h-[calc(100vh-15rem)]'} overflow-y-auto pb-1 px-0.5 -mx-0.5`}>
            {incidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                now={now}
                engine={config?.engine ?? 'model'}
                selected={state.selectedIncident === inc.id}
                onSelect={() => dispatch({ type: 'select', id: inc.id })}
              />
            ))}
          </div>
        )}
      </div>
      <TeamSection open={showTeam} onToggle={() => setShowTeam(!showTeam)} />
    </section>
  )
}
