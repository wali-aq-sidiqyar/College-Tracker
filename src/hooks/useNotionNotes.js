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

  return { notes, loading, error, configured, refresh }
}
