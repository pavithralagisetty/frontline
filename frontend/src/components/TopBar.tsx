import { formatCount, formatSeconds } from '../lib/format'
import { useStore } from '../state/store'
import { SearchBar } from './SearchBar'
import { StatusBadge } from './StatusBadge'

export function TopBar() {
  const { state, dispatch } = useStore()
  const s = state.stats
  const paused = state.frozenLogs !== null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-space-lg flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md shrink-0">
          <div className="flex items-center gap-space-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">hub</span>
            </div>
            <span className="text-headline-sm text-on-surface tracking-tight">Log Triage Agent</span>
          </div>
          <StatusBadge />
        </div>

        <SearchBar />

        <div className="flex items-center gap-space-lg shrink-0">
          <div className="hidden xl:flex items-center gap-space-lg">
            <Counter label="Log lines processed" value={s ? formatCount(s.lines_processed) : '—'} />
            <Counter label="Incidents assigned" value={s ? formatCount(s.incidents_assigned) : '—'} />
            <Counter label="Avg time to assign" value={formatSeconds(s?.avg_time_to_assign_s ?? null)} />
            <Counter label="Open incidents" value={s ? String(s.open_incidents) : '—'} alert={!!s?.open_incidents} />
          </div>
          <button
            onClick={() => dispatch({ type: 'togglePause' })}
            className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container hover:text-on-surface text-on-surface-variant text-label-md flex items-center gap-space-xs transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <span className={`material-symbols-outlined text-[16px] ${paused ? 'text-outline' : 'text-secondary'}`}>
              {paused ? 'play_circle' : 'pause_circle'}
            </span>
            <span className="hidden sm:inline">{paused ? 'Paused' : 'Live Feed'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function Counter({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col text-left">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className={`font-mono text-[15px] leading-5 font-medium tabular-nums ${alert ? 'text-tertiary' : 'text-on-surface'}`}>
        {value}
      </span>
    </div>
  )
}
