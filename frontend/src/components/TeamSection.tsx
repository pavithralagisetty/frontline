import { useMemo } from 'react'
import { shortService } from '../lib/format'
import { useStore } from '../state/store'
import type { Severity } from '../types'

const OPEN = new Set(['analyzing', 'assigned', 'acknowledged', 'escalated'])
const RANK: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const BADGE: Record<Severity | 'none', string> = {
  Critical: 'bg-error-container text-tertiary',
  High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Medium: 'bg-surface-container-highest text-on-surface-variant',
  Low: 'bg-surface-container-high text-outline',
  none: 'bg-surface-container text-outline',
}

interface Row {
  name: string
  initials: string
  label: string
  open: number
  worst: Severity | null
}

// Owners always show; a backup shows up once they hold an open incident.
export function TeamSection() {
  const { team, incidents } = useStore().state

  const rows = useMemo(() => {
    const byName = new Map<string, Row>()
    for (const m of team) {
      byName.set(m.name, { name: m.name, initials: m.initials, label: shortService(m.service), open: 0, worst: null })
    }
    for (const inc of Object.values(incidents)) {
      if (!OPEN.has(inc.status) || !inc.owner) continue
      const row =
        byName.get(inc.owner.name) ??
        byName
          .set(inc.owner.name, {
            name: inc.owner.name,
            initials: inc.owner.initials,
            label: `backup · ${shortService(inc.service)}`,
            open: 0,
            worst: null,
          })
          .get(inc.owner.name)!
      row.open += 1
      if (inc.severity && (!row.worst || RANK[inc.severity] < RANK[row.worst])) row.worst = inc.severity
    }
    return [...byName.values()].sort((a, b) => b.open - a.open)
  }, [team, incidents])

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-space-xs mt-2">
      <div className="flex items-baseline justify-between">
        <span className="text-label-sm uppercase tracking-wider text-outline">Team</span>
        <span className="text-body-sm text-on-surface-variant">Service ownership and open incidents</span>
      </div>
      <div className="w-full bg-surface-container-lowest rounded-xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-label-md text-on-primary-fixed font-medium shrink-0">
                  {r.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-label-md text-on-surface truncate">{r.name}</span>
                  <span className="text-label-sm text-[11px] text-on-surface-variant truncate">{r.label}</span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-label-sm text-[11px] font-medium shrink-0 tabular-nums ${BADGE[r.worst ?? 'none']}`}
              >
                {r.open} open
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
