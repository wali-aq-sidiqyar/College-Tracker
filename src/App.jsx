import { useEffect, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
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

  const editingItem = items.find((item) => item.id === editingId) || null

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

  function handleSave(form) {
    if (editingId) {
      setItems((prev) => prev.map((item) => (item.id === editingId ? { ...form, id: editingId } : item)))
      returnFromEdit()
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }])
    }
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) returnFromEdit()
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

      <div className="app-main">
        <header className="app-header">
          <h1>{TAB_TITLES[activeTab]}</h1>
        </header>

        <main>
          {activeTab === 'calendar' && (
            <CalendarView items={items} onEdit={handleEditRequest} onDelete={handleDelete} />
          )}
          {activeTab === 'assignments' && (
            <ListView items={items} onEdit={handleEditRequest} onDelete={handleDelete} />
          )}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'add' && (
            <ItemForm
              editingItem={editingItem}
              onSave={handleSave}
              onCancel={returnFromEdit}
            />
          )}
        </main>
      </div>
    </div>
  )
}
