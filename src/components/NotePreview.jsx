import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatDateDisplay } from '../utils/date'
import NoteContent from './NoteContent'

// Only used in tree mode (see NotesView) — drilling in renders the note
// inline on the page instead of in this modal.
export default function NotePreview({ note, onClose }) {
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!note) return

    previouslyFocused.current = document.activeElement
    closeRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [note, onClose])

  if (!note) return null

  return createPortal(
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="dialog-card hud-frame dialog-card-wide note-preview-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="note-preview-header">
          <div>
            <h2 id={titleId}>{note.title}</h2>
            <p className="note-preview-meta">
              {[note.className, note.date && formatDateDisplay(note.date), note.semester]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button type="button" className="ghost" ref={closeRef} onClick={onClose}>
            Close
          </button>
        </div>

        <a className="note-preview-link" href={note.url} target="_blank" rel="noopener noreferrer">
          Open in Notion →
        </a>

        <div className="note-preview-body">
          <NoteContent note={note} />
        </div>
      </div>
    </div>,
    document.body
  )
}
