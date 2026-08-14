import { useEffect, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import Sidebar from './components/Sidebar'
import ItemForm from './components/ItemForm'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import './App.css'

const TAB_TITLES = {
  calendar: 'Calendar',
  assignments: 'Assignments',
  notes: 'Notes',
  add: 'Add',
}

export default function App() {
  const [items, setItems] = useLocalStorage('college-tracker-items', [])
  const google = useGoogleCalendar()
  const [activeTab, setActiveTab] = useState('calendar')
  const [editingId, setEditingId] = useState(null)
  const [returnTab, setReturnTab] = useState(null)

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
  const editingItem = allItems.find((item) => item.id === editingId) || null

  // Editing lives on the Add tab, so jump there and remember where to
  // come back to once the edit is saved or cancelled.
  function handleEditRequest(id) {
    setReturnTab(activeTab)
    setEditingId(id)
    setActiveTab('add')
  }

  function returnFromEdit() {
    setEditingId(null)
    if (returnTab) {
      setActiveTab(returnTab)
      setReturnTab(null)
    }
  }

  async function handleSave(form) {
    const { pushToGoogle, ...itemData } = form

    if (editingId) {
      const original = allItems.find((item) => item.id === editingId)
      if (original?.source === 'google') {
        await google.updateEvent(original.googleId, itemData)
      } else {
        setItems((prev) => prev.map((item) => (item.id === editingId ? { ...itemData, id: editingId } : item)))
      }
      returnFromEdit()
    } else if (pushToGoogle) {
      await google.createEvent(itemData)
    } else {
      setItems((prev) => [...prev, { ...itemData, id: crypto.randomUUID() }])
    }
  }

  async function handleDelete(id) {
    const target = allItems.find((item) => item.id === id)
    if (target?.source === 'google') {
      await google.deleteEvent(target.googleId)
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
    if (editingId === id) returnFromEdit()
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} google={google} />

      <div className="app-main">
        <header className="app-header">
          <h1>{TAB_TITLES[activeTab]}</h1>
        </header>

        <main>
          {activeTab === 'calendar' && (
            <CalendarView items={allItems} onEdit={handleEditRequest} onDelete={handleDelete} />
          )}
          {activeTab === 'assignments' && (
            <ListView items={allItems} onEdit={handleEditRequest} onDelete={handleDelete} />
          )}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'add' && (
            <ItemForm
              editingItem={editingItem}
              googleConnected={google.connected === true}
              onSave={handleSave}
              onCancel={returnFromEdit}
            />
          )}
        </main>
      </div>
    </div>
  )
}
