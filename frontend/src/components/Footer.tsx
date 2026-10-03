import { useStore } from '../state/store'

export function Footer() {
  const { config, stats } = useStore().state

  return (
    <footer className="w-full bg-surface-container-low py-6 mt-space-xl shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
      <div className="w-full px-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm text-label-sm text-on-surface-variant">
        <span>
          {config
            ? `Engine: ${config.engine} · ${config.local ? 'local' : 'cloud'} · ${config.agent_mode} mode · Agent active`
            : 'Engine: —'}
        </span>
        <span className="tabular-nums">
          {stats ? `${stats.machine} · RAM ${stats.ram_used_gb.toFixed(1)} GB / ${stats.ram_total_gb} GB` : 'RAM —'}
        </span>
      </div>
    </footer>
  )
}
