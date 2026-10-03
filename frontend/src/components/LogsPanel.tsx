import { useMemo } from 'react'
import { useStore } from '../state/store'
import { FilterChips } from './FilterChips'
import { LogTable } from './LogTable'

export function LogsPanel() {
  const { state, dispatch } = useStore()
  const paused = state.frozenLogs !== null
  const source = state.frozenLogs ?? state.logs

  const flaggedCount = useMemo(() => source.filter((l) => l.level === 'Error').length, [source])

  const visible = useMemo(() => {
    const q = state.search.trim().toLowerCase()
    const f = state.filter
    return source.filter((l) => {
      if (f.kind === 'flagged' && l.level !== 'Error') return false
      if (f.kind === 'service' && l.service !== f.service) return false
      if (q && !`${l.service} ${l.message} ${l.incident_id ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [source, state.filter, state.search])

  return (
    <section className="xl:col-span-5 flex flex-col min-w-0">
      <div className="flex flex-col gap-space-xs mb-space-sm">
        <span className="text-label-sm uppercase tracking-wider text-outline">Live logs</span>
        <div className="flex items-center justify-between gap-space-sm mt-1">
          <FilterChips
            services={state.config?.services ?? []}
            filter={state.filter}
            flaggedCount={flaggedCount}
            onChange={(filter) => dispatch({ type: 'setFilter', filter })}
          />
          <button
            onClick={() => dispatch({ type: 'togglePause' })}
            className={`h-6 px-2 rounded text-label-sm flex items-center gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors shrink-0 ${paused ? 'bg-secondary-fixed/30 text-on-secondary-container' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'}`}
          >
            <span className={`material-symbols-outlined text-[14px] ${paused ? '' : 'text-outline'}`}>
              {paused ? 'play_arrow' : 'pause'}
            </span>
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>
      <LogTable lines={visible} animateFromId={state.animateFromId} />
    </section>
  )
}
