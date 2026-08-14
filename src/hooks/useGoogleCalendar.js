import { useCallback, useEffect, useState } from 'react'
import { googleEventToItem, itemToGoogleEvent } from '../utils/googleEvents'

// Talks only to our own backend (/auth/*, /api/events) — the Google client
// ID, secret, and tokens never reach the browser.
export function useGoogleCalendar() {
  const [connected, setConnected] = useState(null) // null = still checking
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/events')
      if (res.status === 401) {
        setConnected(false)
        setEvents([])
        return
      }
      if (!res.ok) throw new Error('Could not load Google Calendar events.')
      const data = await res.json()
      setEvents(data.items.map(googleEventToItem))
      setConnected(true)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetch('/auth/status')
      .then((res) => res.json())
      .then(({ connected: isConnected }) => {
        setConnected(isConnected)
        if (isConnected) refresh()
      })
      .catch(() => setConnected(false))
  }, [refresh])

  // Re-pull from Google whenever you come back to this tab — so an event
  // added on your phone shows up without a full page reload.
  useEffect(() => {
    if (!connected) return
    function onFocus() {
      if (document.visibilityState !== 'hidden') refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [connected, refresh])

  function connect() {
    window.location.href = '/auth/google'
  }

  async function disconnect() {
    await fetch('/auth/disconnect', { method: 'POST' })
    setConnected(false)
    setEvents([])
    setError(null)
  }

  async function createEvent(item) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemToGoogleEvent(item)),
    })
    if (!res.ok) throw new Error('Could not create the Google Calendar event.')
    await refresh()
  }

  async function updateEvent(googleId, item) {
    const res = await fetch(`/api/events/${googleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemToGoogleEvent(item)),
    })
    if (!res.ok) throw new Error('Could not update the Google Calendar event.')
    await refresh()
  }

  async function deleteEvent(googleId) {
    const res = await fetch(`/api/events/${googleId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Could not delete the Google Calendar event.')
    await refresh()
  }

  return {
    connected,
    events,
    error,
    refreshing,
    connect,
    disconnect,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
