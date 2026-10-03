import { useEffect } from 'react'
import { useStore } from '../state/store'
import { getState } from './rest'

// Loads /api/state right away, then follows /api/stream. EventSource reconnects
// on its own; after a reconnect we reload the snapshot so nothing is missed.
export function useEventStream() {
  const { dispatch } = useStore()

  useEffect(() => {
    const load = () =>
      getState()
        .then((data) => dispatch({ type: 'snapshot', data }))
        .catch(() => dispatch({ type: 'connected', value: false }))

    load()
    const es = new EventSource('/api/stream')
    let opened = false

    es.onopen = () => {
      dispatch({ type: 'connected', value: true })
      if (opened) load()
      opened = true
    }
    es.onerror = () => dispatch({ type: 'connected', value: false })

    es.addEventListener('log', (e) => dispatch({ type: 'log', line: JSON.parse(e.data) }))
    es.addEventListener('stats', (e) => dispatch({ type: 'stats', stats: JSON.parse(e.data) }))

    return () => es.close()
  }, [dispatch])
}
