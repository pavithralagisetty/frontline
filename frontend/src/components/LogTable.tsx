import type { LogLine } from '../types'
import { LogRow } from './LogRow'

export function LogTable({ lines, animateFromId }: { lines: LogLine[]; animateFromId: number }) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-12.5rem)]">
        {/* table-fixed keeps column widths stable as rows stream in */}
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[4.5rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[4.25rem]" />
            <col />
            <col className="w-[4.5rem]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="h-8 bg-surface-container-low text-outline text-label-sm text-[11px] uppercase tracking-wider">
              <th className="pl-3.5 pr-2 font-medium">Time</th>
              <th className="px-2 font-medium">Service</th>
              <th className="px-2 font-medium">Level</th>
              <th className="px-2 font-medium">Message</th>
              <th className="pr-3.5 pl-2 font-medium text-right">Ref</th>
            </tr>
          </thead>
          <tbody className="text-[12px] divide-y divide-surface-container-high">
            {lines.map((line) => (
              <LogRow key={line.id} line={line} animate={line.id > animateFromId} />
            ))}
          </tbody>
        </table>
        {lines.length === 0 && (
          <div className="py-10 text-center text-body-sm text-on-surface-variant">No log lines match.</div>
        )}
      </div>
    </div>
  )
}
