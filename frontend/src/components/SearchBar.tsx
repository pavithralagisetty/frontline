import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'

export function SearchBar() {
  const { state, dispatch } = useStore()
  const input = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex-1 max-w-md mx-auto hidden md:block">
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-outline pointer-events-none">
          search
        </span>
        <input
          ref={input}
          value={state.search}
          onChange={(e) => dispatch({ type: 'setSearch', search: e.target.value })}
          onKeyDown={(e) => e.key === 'Escape' && dispatch({ type: 'setSearch', search: '' })}
          className="w-full h-8 pl-8 pr-12 bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-container shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          placeholder="Search logs, incidents, services..."
          type="text"
        />
        <div className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-mono-id pointer-events-none">
          ⌘K
        </div>
      </div>
    </div>
  )
}
