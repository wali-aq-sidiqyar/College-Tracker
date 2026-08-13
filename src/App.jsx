import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import ItemForm from './components/ItemForm'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import { todayBoardLabel } from './utils/date'
import './App.css'

export default function App() {
  const [items, setItems] = useLocalStorage('college-tracker-items', [])
  const [view, setView] = useState('list')
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
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>College Tracker</h1>
          <p className="app-tagline">What&rsquo;s due, what&rsquo;s next.</p>
        </div>
        <div className="app-header-controls">
          <span className="today-chip">{todayBoardLabel()}</span>
          <div className="view-toggle">
            <button
              className={view === 'list' ? 'active' : 'secondary'}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={view === 'calendar' ? 'active' : 'secondary'}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>
        </div>
      </header>

      <ItemForm
        editingItem={editingItem}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
      />

      <main>
        {view === 'list' ? (
          <ListView items={items} onEdit={setEditingId} onDelete={handleDelete} />
        ) : (
          <CalendarView items={items} onEdit={setEditingId} onDelete={handleDelete} />
        )}
      </main>
    </div>
  )
}
