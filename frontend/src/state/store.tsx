import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { AppConfig, Incident, LogFilter, LogLine, StateSnapshot, Stats, TeamMember } from '../types'

const MAX_LOGS = 200

export interface State {
  logs: LogLine[] // newest first
  frozenLogs: LogLine[] | null // set while paused
  animateFromId: number // rows with a higher id arrived live and animate in
  incidents: Record<string, Incident>
  team: TeamMember[]
  selectedIncident: string | null
  stats: Stats | null
  config: AppConfig | null
  filter: LogFilter
  search: string
  connected: boolean
}

export type Action =
  | { type: 'snapshot'; data: StateSnapshot }
  | { type: 'log'; line: LogLine }
  | { type: 'stats'; stats: Stats }
  | { type: 'incident'; incident: Incident }
  | { type: 'select'; id: string | null }
  | { type: 'connected'; value: boolean }
  | { type: 'setFilter'; filter: LogFilter }
  | { type: 'setSearch'; search: string }
  | { type: 'togglePause' }

const initial: State = {
  logs: [],
  frozenLogs: null,
  animateFromId: Number.MAX_SAFE_INTEGER,
  incidents: {},
  team: [],
  selectedIncident: null,
  stats: null,
  config: null,
  filter: { kind: 'all' },
  search: '',
  connected: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'snapshot': {
      const logs = [...action.data.logs].reverse().slice(0, MAX_LOGS)
      return {
        ...state,
        logs,
        animateFromId: logs[0]?.id ?? 0,
        incidents: Object.fromEntries(action.data.incidents.map((i) => [i.id, i])),
        team: action.data.team,
        stats: action.data.stats,
        config: action.data.config,
      }
    }
    case 'log': {
      // The stream can replay a line we already got from the snapshot.
      if (state.logs.length && action.line.id <= state.logs[0].id) return state
      return { ...state, logs: [action.line, ...state.logs].slice(0, MAX_LOGS) }
    }
    case 'stats':
      return { ...state, stats: action.stats }
    case 'incident':
      return { ...state, incidents: { ...state.incidents, [action.incident.id]: action.incident } }
    case 'select':
      return { ...state, selectedIncident: action.id === state.selectedIncident ? null : action.id }
    case 'connected':
      return { ...state, connected: action.value }
    case 'setFilter':
      return { ...state, filter: action.filter }
    case 'setSearch':
      return { ...state, search: action.search }
    case 'togglePause':
      return { ...state, frozenLogs: state.frozenLogs ? null : state.logs }
  }
}

const StoreContext = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
