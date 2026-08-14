import { useEffect, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import Sidebar from './components/Sidebar'
import ItemForm from './components/ItemForm'
import ListView from './components/ListView'
import EventsListView from './components/EventsListView'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import './App.css'

const TAB_TITLES = {
  calendar: 'Calendar',
  tasks: 'Tasks',
  events: 'Events',
  notes: 'Notes',
  add: 'Add',
}

export default function App() {
  const [items, setItems] = useLocalStorage('college-tracker-items', [])
  const google = useGoogleCalendar()
  const [activeTab, setActiveTab] = useState('calendar')
  const [editingId, setEditingId] = useState(null)
  const [returnTab, setReturnTab] = useState(null)
  const [addDefaultKind, setAddDefaultKind] = useState(null)

  // Items saved before Event/Task existed have no `kind`. Treat anything
  // with a start time as an Event, everything else as a Task.
  useEffect(() => {
    setItems((prev) =>
      prev.every((item) => item.kind)
        ? prev
        : prev.map((item) => ({ ...item, kind: item.kind ?? (item.startTime ? 'event' : 'task') }))
    )
  }, [setItems])

  // The OAuth callback redirects here with ?google=connected/error — the
  // connection status itself comes from /auth/status, so this is just
  // tidying the URL bar back up.
  useEffect(() => {
    if (!window.location.search.includes('google=')) return
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const allItems = [...items, ...google.events]
  const taskItems = allItems.filter((item) => item.kind === 'task')
  const eventItems = allItems.filter((item) => item.kind === 'event')
  const editingItem = allItems.find((item) => item.id === editingId) || null

  // Editing lives on the Add tab, so jump there and remember where to
  // come back to once the edit is saved or cancelled.
  function handleEditRequest(id) {
    setReturnTab(activeTab)
    setEditingId(id)
    setActiveTab('add')
  }

  // Same idea for "Add task"/"Add event" from within the Tasks/Events
  // tabs — jump to the Add tab pre-set to that kind, and remember to
  // come back to the tab that asked for it.
  function handleAddRequest(kind) {
    setReturnTab(activeTab)
    setAddDefaultKind(kind)
    setEditingId(null)
    setActiveTab('add')
  }

  function returnToOrigin() {
    setEditingId(null)
    setAddDefaultKind(null)
    if (returnTab) {
      setActiveTab(returnTab)
      setReturnTab(null)
    }
  }

  // Navigating via the sidebar directly (rather than an edit/add request)
  // should always land on a clean slate, not leftover edit/add-in-progress
  // state from wherever you were before.
  function handleNavSelect(tab) {
    setEditingId(null)
    setReturnTab(null)
    setAddDefaultKind(null)
    setActiveTab(tab)
  }

  // Errors intentionally propagate out of here — ItemForm awaits this and
  // shows them, rather than the item silently disappearing.
  async function handleSave(itemData) {
    if (editingId) {
      const original = allItems.find((item) => item.id === editingId)
      if (original?.source === 'google') {
        await google.updateEvent(original.googleId, itemData)
      } else {
        setItems((prev) => prev.map((item) => (item.id === editingId ? { ...itemData, id: editingId } : item)))
      }
      returnToOrigin()
    } else {
      if (google.connected) {
        await google.createEvent(itemData)
      } else {
        setItems((prev) => [...prev, { ...itemData, id: crypto.randomUUID() }])
      }
      // Only hop back to Tasks/Events if that's where this add started —
      // arriving via the plain Add tab keeps you there to add more.
      if (returnTab) returnToOrigin()
    }
  }

  // Also lets errors propagate — the delete-confirm dialog awaits this and
  // keeps the item (and itself open) until the delete actually succeeds.
  async function handleDelete(id) {
    const target = allItems.find((item) => item.id === id)
    if (target?.source === 'google') {
      await google.deleteEvent(target.googleId)
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
    if (editingId === id) returnToOrigin()
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onSelect={handleNavSelect} google={google} />

      <div className="app-main">
        <header className="app-header">
          <h1>{TAB_TITLES[activeTab]}</h1>
        </header>

        <main>
          {activeTab === 'calendar' && (
            <CalendarView items={allItems} onEdit={handleEditRequest} onDelete={handleDelete} />
          )}
          {activeTab === 'tasks' && (
            <ListView
              items={taskItems}
              kind="task"
              onAddRequest={handleAddRequest}
              onEdit={handleEditRequest}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'events' && (
            <EventsListView
              items={eventItems}
              onAddRequest={handleAddRequest}
              onEdit={handleEditRequest}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'add' && (
            <ItemForm
              editingItem={editingItem}
              defaultKind={addDefaultKind}
              canCancel={Boolean(editingItem || returnTab)}
              googleConnected={google.connected === true}
              onSave={handleSave}
              onCancel={returnToOrigin}
            />
          )}
        </main>
      </div>
    </div>
  )
}
