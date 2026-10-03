// Shared types matching the backend payloads.

export type Level = 'Info' | 'Warn' | 'Error'

export interface LogLine {
  id: number
  ts: number // unix seconds
  service: string
  level: Level
  message: string // already masked by the backend
  incident_id: string | null
}

export interface Stats {
  lines_processed: number
  by_level: Record<Level, number>
  incidents_assigned: number
  avg_time_to_assign_s: number | null
  open_incidents: number
}

export interface AppConfig {
  engine: string
  agent_mode: string
  local: boolean
  services: string[]
}

export interface StateSnapshot {
  logs: LogLine[] // oldest first
  incidents: unknown[]
  team: unknown[]
  stats: Stats
  config: AppConfig
}

export type LogFilter = { kind: 'all' } | { kind: 'flagged' } | { kind: 'service'; service: string }
