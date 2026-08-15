import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { todayISO } from '../utils/date'

// Asks only for Title + Date — Class/Semester/Year come from whichever
// folder you drilled into and are shown as read-only context, not fields.
export default function NewNoteDialog({ open, context, onCreate, onClose }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const titleRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDate(todayISO())
    setPending(false)
    setError(null)
    setCreated(null)
    titleRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !pending) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, pending, onClose])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !date || pending) return
    setPending(true)
    setError(null)
    try {
      const result = await onCreate(title.trim(), date)
      setCreated(result)
    } catch (err) {
      setError(err.message || 'Could not create this note in Notion.')
    } finally {
      setPending(false)
    }
  }

  return createPortal(
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose()
      }}
    >
      <div className="dialog-card hud-frame" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{created ? 'Note created' : 'New note'}</h2>

        {!created ? (
          <form onSubmit={handleSubmit}>
            <p className="dialog-description">
              Adding to: {[context.className, context.semester, context.year].filter(Boolean).join(' · ')}
            </p>

            <label>
              Title
              <input
                ref={titleRef}
                type="text"
                placeholder="e.g. Lecture 12 notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={pending}
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={pending}
                required
              />
            </label>

            {error && <p className="dialog-error">{error}</p>}

            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={onClose} disabled={pending}>
                Cancel
              </button>
              <button type="submit" disabled={pending || !title.trim() || !date}>
                {pending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="dialog-description">
              &ldquo;{title}&rdquo; was added to Notion — this app only tracks the entry, so write the actual
              content over there.
            </p>
            <a className="note-preview-link" href={created.url} target="_blank" rel="noopener noreferrer">
              Open in Notion →
            </a>
            <div className="dialog-actions">
              <button type="button" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
