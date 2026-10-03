import { memo } from 'react'
import { formatTime, shortService } from '../lib/format'
import type { Level, LogLine } from '../types'

const LEVEL_STYLE: Record<Level, { text: string; dot: string }> = {
  Error: { text: 'text-error', dot: 'bg-error' },
  Warn: { text: 'text-warn', dot: 'bg-warn-dot' },
  Info: { text: 'text-outline', dot: 'bg-outline' },
}

// Only Error rows are flagged. Warn rows get the amber dot and nothing else.
export const LogRow = memo(function LogRow({ line, animate }: { line: LogLine; animate: boolean }) {
  const flagged = line.level === 'Error'
  const lvl = LEVEL_STYLE[line.level]

  return (
    <tr
      className={`h-9 transition-colors ${flagged ? 'bg-error-container/20 hover:bg-error-container/30' : 'hover:bg-surface-container-low'} ${animate ? 'row-in' : ''}`}
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
          <span className="px-1.5 py-0.5 rounded bg-error-container text-tertiary font-mono text-[10px] font-medium">
            {line.incident_id}
          </span>
        )}
      </td>
    </tr>
  )
})
