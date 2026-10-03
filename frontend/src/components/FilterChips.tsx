import { shortService } from '../lib/format'
import type { LogFilter } from '../types'

interface Props {
  services: string[]
  filter: LogFilter
  flaggedCount: number
  onChange: (f: LogFilter) => void
}

export function FilterChips({ services, filter, flaggedCount, onChange }: Props) {
  const active = 'bg-primary-container text-on-primary shadow-sm'

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 min-w-0">
      <button
        onClick={() => onChange({ kind: 'all' })}
        className={`h-6 px-2.5 rounded-full text-label-sm transition-colors shrink-0 ${filter.kind === 'all' ? active : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'}`}
      >
        All
      </button>
      <button
        onClick={() => onChange({ kind: 'flagged' })}
        className={`h-6 px-2 rounded-full text-label-sm flex items-center gap-1 transition-colors shrink-0 ${filter.kind === 'flagged' ? active : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'}`}
      >
        <span>Flagged</span>
        <span className="px-1.5 rounded-full bg-error-container text-on-error-container font-mono text-[10px] tabular-nums">
          {flaggedCount}
        </span>
      </button>
      {services.map((svc) => {
        const on = filter.kind === 'service' && filter.service === svc
        return (
          <button
            key={svc}
            onClick={() => onChange(on ? { kind: 'all' } : { kind: 'service', service: svc })}
            className={`h-6 px-2 rounded-full text-label-sm transition-colors shrink-0 whitespace-nowrap ${on ? active : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'}`}
          >
            {shortService(svc)}
          </button>
        )
      })}
    </div>
  )
}
