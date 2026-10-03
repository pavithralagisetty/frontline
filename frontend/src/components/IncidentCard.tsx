import { ago } from '../lib/useNow'
import type { Incident } from '../types'
import { AgentSteps } from './AgentSteps'
import { SeverityPill } from './SeverityPill'
import { StatusPill } from './StatusPill'

const AVATAR: Record<string, string> = {
  Critical: 'bg-primary-fixed text-on-primary-fixed',
  High: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  Medium: 'bg-secondary-fixed text-on-secondary-fixed',
  Low: 'bg-primary-fixed-dim text-on-primary-fixed',
}

interface Props {
  incident: Incident
  selected: boolean
  now: number
  engine: string
  onSelect: () => void
}

export function IncidentCard({ incident: inc, selected, now, engine, onSelect }: Props) {
  const analyzing = inc.status === 'analyzing'
  const resolved = inc.status === 'resolved'

  return (
    <div
      onClick={onSelect}
      className={`w-full rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? 'bg-surface-container-lowest ring-1 ring-primary-container/40 shadow-[0_4px_16px_-4px_rgba(62,99,221,0.12),0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md'
      } ${resolved ? 'opacity-85 hover:opacity-100' : ''}`}
    >
      {/* Header line */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-1">
        <div className="flex items-center gap-2">
          <SeverityPill severity={inc.severity} />
          <span className="font-mono text-mono-id text-on-surface font-medium">{inc.id}</span>
          <StatusPill status={inc.status} />
        </div>
        <span className="text-[11px] text-on-surface-variant">
          {analyzing ? `Started ${ago(now - inc.first_seen)}` : inc.assigned_at && `Assigned ${ago(now - inc.assigned_at)}`}
        </span>
      </div>

      {/* Title and count/timing */}
      <div className="mt-2">
        {analyzing ? (
          <div className="h-5 w-2/3 rounded bg-surface-container animate-pulse" />
        ) : (
          <h3 className="text-headline-sm text-on-surface font-medium">{inc.title}</h3>
        )}
        <p className="mt-0.5 text-[11px] text-on-surface-variant">
          <span className="font-mono tabular-nums">{inc.count}</span> {inc.count === 1 ? 'error' : 'errors'} in{' '}
          {inc.service} · first {ago(now - inc.first_seen)} · last {ago(now - inc.last_seen)}
        </p>
      </div>

      {/* Diagnostic details */}
      <div className="bg-surface-container-low p-3 rounded-lg my-3 space-y-2 text-body-sm">
        {analyzing ? (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary animate-spin">progress_activity</span>
            Analyzing with {engine}…
          </div>
        ) : (
          <>
            <Detail label="Likely cause:" value={inc.likely_cause} />
            <Detail label="First step:" value={inc.first_step} />
          </>
        )}
      </div>

      {/* Assigned to */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-1">
        {inc.owner ? (
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-medium ${AVATAR[inc.severity ?? 'Low']}`}
            >
              {inc.owner.initials}
            </div>
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface leading-tight">{inc.owner.name}</span>
              <span className="text-[11px] text-on-surface-variant">
                {inc.owner.team} · {inc.service}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-outline">Finding owner…</span>
        )}
      </div>

      <AgentSteps steps={inc.agent_steps} totalMs={inc.analysis_ms} />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-on-surface-variant shrink-0 w-24">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  )
}
