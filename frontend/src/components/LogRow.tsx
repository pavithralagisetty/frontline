import { memo } from 'react'
import { formatTime, shortService } from '../lib/format'
import type { Level, LogLine, Severity } from '../types'
import { SEVERITY_TAG } from './SeverityPill'

const LEVEL_STYLE: Record<Level, { text: string; dot: string }> = {
  Error: { text: 'text-error', dot: 'bg-error' },
  Warn: { text: 'text-warn', dot: 'bg-warn-dot' },
  Info: { text: 'text-outline', dot: 'bg-outline' },
}

// Only Error rows are flagged. Warn rows get the amber dot and nothing else.
interface Props {
  line: LogLine
  animate: boolean
  severity: Severity | null // severity of this line's incident, if triaged
  highlighted: boolean // the line belongs to the selected incident
  onSelectIncident: (id: string) => void
}

export const LogRow = memo(function LogRow({ line, animate, severity, highlighted, onSelectIncident }: Props) {
  const flagged = line.level === 'Error'
  const lvl = LEVEL_STYLE[line.level]
  const bg = highlighted
    ? 'bg-primary-fixed/60 hover:bg-primary-fixed/80'
    : flagged
      ? 'bg-error-container/20 hover:bg-error-container/30'
      : 'hover:bg-surface-container-low'

  return (
    <tr
      className={`h-9 transition-colors ${bg} ${animate ? 'row-in' : ''}`}
    >
      <td className="pl-3.5 pr-2 font-mono text-[11px] text-outline whitespace-nowrap tabular-nums">
        {formatTime(line.ts)}
      </td>
      <td className="px-2">
        <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface text-label-sm text-[10px] whitespace-nowrap">
          {shortService(line.service)}
        </span>
      </td>
      <td className="px-2 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-label-sm ${lvl.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
          {line.level}
        </span>
      </td>
      <td
        className={`px-2 font-mono text-[11px] truncate ${flagged ? 'text-on-surface' : 'text-on-surface-variant'}`}
        title={line.message}
      >
        {line.message}
      </td>
      <td className="pr-3.5 pl-2 text-right whitespace-nowrap">
        {flagged && line.incident_id && (
          <button
            onClick={() => onSelectIncident(line.incident_id!)}
            className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium hover:ring-1 hover:ring-primary-container/40 ${SEVERITY_TAG[severity ?? 'Critical']}`}
          >
            {line.incident_id}
          </button>
        )}
      </td>
    </tr>
  )
})
