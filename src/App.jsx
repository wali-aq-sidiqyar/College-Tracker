import { useState } from 'react'
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
}

export default function App() {
  const [items, setItems] = useLocalStorage('college-tracker-items', [])
  const [activeTab, setActiveTab] = useState('assignments')
  const [editingId, setEditingId] = useState(null)

  const editingItem = items.find((item) => item.id === editingId) || null

  function handleSave(form) {
    if (editingId) {
      setItems((prev) => prev.map((item) => (item.id === editingId ? { ...form, id: editingId } : item)))
      setEditingId(null)
    } else {
      setItems((prev) => [...prev, { ...form, id: crypto.randomUUID() }])
    }
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) setEditingId(null)
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

      <div className="app-main">
        <header className="app-header">
          <h1>{TAB_TITLES[activeTab]}</h1>
        </header>

        {activeTab !== 'notes' && (
          <ItemForm
            editingItem={editingItem}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        )}

        <main>
          {activeTab === 'calendar' && (
            <CalendarView items={items} onEdit={setEditingId} onDelete={handleDelete} />
          )}
          {activeTab === 'assignments' && (
            <ListView items={items} onEdit={setEditingId} onDelete={handleDelete} />
          )}
          {activeTab === 'notes' && <NotesView />}
        </main>
      </div>
    </div>
  )
}
