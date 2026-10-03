import { useEventStream } from './api/useEventStream'
import { Footer } from './components/Footer'
import { LogsPanel } from './components/LogsPanel'
import { TopBar } from './components/TopBar'
import { TriagePanel } from './components/TriagePanel'
import { StoreProvider } from './state/store'

function Dashboard() {
  useEventStream()

  return (
    <>
      <TopBar />
      <main className="w-full pt-16 bg-surface">
        <div className="w-full px-space-lg py-space-lg lg:px-space-xl lg:py-space-xl">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <LogsPanel />
            <TriagePanel />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Dashboard />
    </StoreProvider>
  )
}
