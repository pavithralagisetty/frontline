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
  ram_used_gb: number
  ram_total_gb: number
  machine: string
}

export interface AppConfig {
  engine: string
  agent_mode: string
  local: boolean
  services: string[]
}

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'analyzing' | 'assigned' | 'acknowledged' | 'escalated' | 'resolved'

export interface Person {
  name: string
  initials: string
  team: string | null
}

export interface AgentStep {
  name: string
  detail: string
  done: boolean
}

export interface Incident {
  id: string
  service: string
  status: IncidentStatus
  severity: Severity | null // null while analyzing
  title: string | null
  count: number
  first_seen: number
  last_seen: number
  first_message: string
  likely_cause: string | null
  first_step: string | null
  owner: Person | null
  backup: Person | null
  team: string | null
  agent_steps: AgentStep[]
  analysis_ms: number | null
  assigned_at: number | null
  escalate_at: number | null
  escalated_at: number | null
  acknowledged_at: number | null
  resolved_at: number | null
  previous_owner: Person | null
  confidence: number | null
  line_ids: number[]
}

export interface TeamMember {
  service: string
  team: string
  name: string
  initials: string
}

export interface StateSnapshot {
  logs: LogLine[] // oldest first
  incidents: Incident[]
  team: TeamMember[]
  stats: Stats
  config: AppConfig
}

export type LogFilter = { kind: 'all' } | { kind: 'flagged' } | { kind: 'service'; service: string }
