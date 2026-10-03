import type { Severity } from '../types'

// Colors from the design: Critical red, High salmon, Medium grey, Low faded.
export const SEVERITY_STYLE: Record<Severity, string> = {
  Critical: 'bg-error-container text-on-error-container',
  High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Medium: 'bg-surface-container-highest text-on-surface-variant',
  Low: 'bg-surface-container-high text-outline',
}

// Same palette for the small incident tag in the logs table.
export const SEVERITY_TAG: Record<Severity, string> = {
  Critical: 'bg-error-container text-tertiary',
  High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Medium: 'bg-surface-container-highest text-on-surface-variant',
  Low: 'bg-surface-container-high text-outline',
}

export function SeverityPill({ severity }: { severity: Severity | null }) {
  if (!severity) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline text-label-sm animate-pulse">
        Triage…
      </span>
    )
  }
  return <span className={`px-2 py-0.5 rounded-full text-label-sm font-medium ${SEVERITY_STYLE[severity]}`}>{severity}</span>
}
