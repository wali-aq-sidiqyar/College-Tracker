import { useCallback, useEffect, useState } from 'react'

export function useNotionNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notion/notes')
      if (res.status === 401) {
        setConfigured(false)
        setNotes([])
        return
      }
      if (!res.ok) throw new Error('Could not load notes from Notion.')
      setConfigured(true)
      const data = await res.json()
      setNotes(data.notes)
    } catch (err) {
      setError(err.message || 'Could not load notes from Notion.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-pull whenever you come back to this tab — so a class/note added in
  // Notion directly (not through this app) shows up, including in the
  // Class dropdown on the Add form, without needing a manual reload.
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState !== 'hidden') refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  return { notes, loading, error, configured, refresh }
}
