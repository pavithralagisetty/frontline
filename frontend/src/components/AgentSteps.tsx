import { useState } from 'react'
import type { AgentStep } from '../types'

export function AgentSteps({ steps, totalMs }: { steps: AgentStep[]; totalMs: number | null }) {
  const [open, setOpen] = useState(false)
  if (steps.length === 0) return null

  return (
    <div className="mt-3 pt-2 border-t border-surface-container-high">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="w-full flex items-center justify-between text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="flex items-center gap-1">
          <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? 'rotate-90' : ''}`}>
            chevron_right
          </span>
          Agent steps · {steps.length}
        </span>
        {totalMs !== null && <span className="font-mono text-[11px] text-outline">{(totalMs / 1000).toFixed(1)}s total</span>}
      </button>
      {open && (
        <ol className="mt-2 ml-1 space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm">
              <span
                className={`material-symbols-outlined text-[15px] mt-px ${s.done ? 'text-secondary' : 'text-primary animate-spin'}`}
              >
                {s.done ? 'check_circle' : 'progress_activity'}
              </span>
              <span className="text-on-surface-variant w-36 shrink-0">{s.name}</span>
              <span className="text-on-surface">{s.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
