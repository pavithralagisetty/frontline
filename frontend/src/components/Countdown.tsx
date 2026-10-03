// Critical incidents only: time left before the incident moves to the backup.
export function Countdown({ escalateAt, now, backup }: { escalateAt: number; now: number; backup: string | null }) {
  const left = Math.max(0, Math.ceil(escalateAt - now))
  const m = Math.floor(left / 60)
  const s = String(left % 60).padStart(2, '0')

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono text-[11px] font-medium tabular-nums">
      <span className="material-symbols-outlined text-[13px]">timer</span>
      <span>{left > 0 ? `Escalating to ${backup ?? 'backup'} in ${m}:${s}` : 'Escalating…'}</span>
    </div>
  )
}
