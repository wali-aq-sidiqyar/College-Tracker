import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export default function RemindersListView({ items, onAddRequest, onToggleComplete, onDelete }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [completingIds, setCompletingIds] = useState(() => new Set())
  const [completeError, setCompleteError] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const activeReminders = items.filter((item) => !item.completed)
  const completedReminders = items.filter((item) => item.completed)
  const pendingReminder = items.find((item) => item.id === pendingDeleteId)

  async function handleToggleComplete(id) {
    setCompleteError(null)
    setCompletingIds((prev) => new Set(prev).add(id))
    try {
      await onToggleComplete(id)
    } catch (err) {
      setCompleteError(err.message || 'Could not update this reminder. Try again.')
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this reminder. Nothing was lost — try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <button type="button" onClick={onAddRequest}>
          Add reminder
        </button>

        {completedReminders.length > 0 && (
          <label className="list-show-completed">
            <input
              type="checkbox"
              className="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show completed ({completedReminders.length})
          </label>
        )}
      </div>

      {completeError && <p className="form-error">{completeError}</p>}

      {activeReminders.length === 0 && completedReminders.length === 0 ? (
        <p className="empty-state">No reminders yet. Add one above.</p>
      ) : (
        <>
          {activeReminders.length === 0 ? (
            <p className="empty-state">Nothing active — nice work.</p>
          ) : (
            <ReminderRows
              reminders={activeReminders}
              completingIds={completingIds}
              onToggleComplete={handleToggleComplete}
              onRequestDelete={setPendingDeleteId}
            />
          )}

          {showCompleted && completedReminders.length > 0 && (
            <section className="event-section">
              <h3 className="event-section-heading">Completed</h3>
              <ReminderRows
                reminders={completedReminders}
                completingIds={completingIds}
                onToggleComplete={handleToggleComplete}
                onRequestDelete={setPendingDeleteId}
              />
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingReminder != null}
        title={`Delete “${pendingReminder?.text}”?`}
        description="This can't be undone."
        pending={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingDeleteId(null)
          setDeleteError(null)
        }}
      />
    </div>
  )
}

function ReminderRows({ reminders, completingIds, onToggleComplete, onRequestDelete }) {
  return (
    <ul className="item-list">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className={`reminder-row${reminder.completed ? ' reminder-row-completed' : ''}`}
        >
          <label
            className="item-row-complete"
            title={reminder.completed ? 'Mark as not done' : 'Mark as done'}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={Boolean(reminder.completed)}
              onChange={() => onToggleComplete(reminder.id)}
              disabled={completingIds.has(reminder.id)}
              aria-label={reminder.completed ? `Mark ${reminder.text} as not done` : `Mark ${reminder.text} as done`}
            />
            <span className="done-toggle" aria-hidden="true">
              <CheckIcon />
            </span>
          </label>
          <span className="reminder-row-text">{reminder.text}</span>
          <button type="button" className="ghost danger" onClick={() => onRequestDelete(reminder.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
