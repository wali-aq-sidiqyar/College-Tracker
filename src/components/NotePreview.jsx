import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDateDisplay } from '../utils/date'
import { NotionBlockList } from './NotionBlocks'

// Fetches fresh block content every time a note is opened, rather than
// caching it — Notion's image URLs are pre-signed and expire after about an
// hour, so a cached render would eventually show broken images.
export default function NotePreview({ note, onClose }) {
  const [blocks, setBlocks] = useState(null)
  const [error, setError] = useState(null)
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!note) return
    let cancelled = false
    setBlocks(null)
    setError(null)

    fetch(`/api/notion/notes/${note.id}/blocks`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load this note from Notion.')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setBlocks(data.blocks)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this note from Notion.')
      })

    return () => {
      cancelled = true
    }
  }, [note])

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
          {error && <p className="dialog-error">{error}</p>}
          {!error && !blocks && <p className="empty-state">Loading…</p>}
          {!error && blocks && blocks.length === 0 && <p className="empty-state">This note is empty.</p>}
          {!error && blocks && blocks.length > 0 && (
            <div className="notion-content">
              <NotionBlockList blocks={blocks} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
