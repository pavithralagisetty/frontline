import type { Incident, StateSnapshot } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const getState = () => request<StateSnapshot>('/api/state')

export type IncidentAction = 'ack' | 'reassign' | 'resolve'

export const incidentAction = (id: string, action: IncidentAction) =>
  request<Incident>(`/api/incidents/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
