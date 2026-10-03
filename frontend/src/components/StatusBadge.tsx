import { useStore } from '../state/store'

// Says where the model actually runs, based on the configured base URL.
export function StatusBadge() {
  const { config, connected } = useStore().state

  if (!connected) {
    return (
      <Badge tone="bg-error-container text-on-error-container" dot="bg-error">
        Disconnected · reconnecting…
      </Badge>
    )
  }
  if (!config) return null
  return config.local ? (
    <Badge tone="bg-secondary-fixed/30 text-on-secondary-container" dot="bg-secondary animate-pulse">
      Running locally · No cloud AI
    </Badge>
  ) : (
    <Badge tone="bg-tertiary-fixed/50 text-on-tertiary-fixed-variant" dot="bg-tertiary-container animate-pulse">
      Cloud model · development mode
    </Badge>
  )
}

function Badge({ tone, dot, children }: { tone: string; dot: string; children: React.ReactNode }) {
  return (
    <div className={`hidden xl:flex items-center gap-space-xs px-2.5 py-1 rounded-full text-label-sm ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{children}</span>
    </div>
  )
}
