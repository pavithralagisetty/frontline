import type { IncidentStatus } from '../types'

const STYLE: Record<IncidentStatus, { label: string; text: string; dot: string }> = {
  analyzing: { label: 'Analyzing', text: 'text-primary', dot: 'bg-primary animate-pulse' },
  assigned: { label: 'Assigned', text: 'text-primary', dot: 'bg-primary' },
  acknowledged: { label: 'Acknowledged', text: 'text-warn', dot: 'bg-warn-dot' },
  escalated: { label: 'Escalated', text: 'text-error', dot: 'bg-error' },
  resolved: { label: 'Resolved', text: 'text-secondary', dot: 'bg-secondary' },
}

export function StatusPill({ status }: { status: IncidentStatus }) {
  const s = STYLE[status]
  return (
    <span className={`inline-flex items-center gap-1 text-label-sm font-medium ${s.text}`}>
      <span className="relative flex w-1.5 h-1.5">
        {status === 'escalated' && <span className="absolute inset-0 rounded-full bg-error opacity-75 animate-ping" />}
        <span className={`relative w-1.5 h-1.5 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  )
}
