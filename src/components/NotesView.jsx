import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNotionNotes } from '../hooks/useNotionNotes'
import { buildNotesTree } from '../utils/notesTree'
import { formatDateDisplay } from '../utils/date'
import NotesTree from './NotesTree'
import NotePreview from './NotePreview'
import NoteContent from './NoteContent'
import NewNoteDialog from './NewNoteDialog'

export default function NotesView() {
  const { notes, loading, error, configured, refresh } = useNotionNotes()
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [drillPath, setDrillPath] = useState([])
  const [modalNote, setModalNote] = useState(null)
  const [newNoteOpen, setNewNoteOpen] = useState(false)

  const tree = useMemo(() => buildNotesTree(notes), [notes])

  // A fresh notes list rebuilds the tree from scratch, so any node objects
  // held in drillPath are stale references even if nothing actually
  // changed (e.g. a plain Refresh). Re-resolve the path by key against the
  // new tree instead of resetting outright, so refreshing doesn't yank you
  // back to the root — it only truncates if a segment genuinely no longer
  // exists (expandedIds needs no such repair; it's just string keys).
  useEffect(() => {
    setDrillPath((prev) => resolvePath(tree, prev))
  }, [tree])

  function toggleExpanded(key) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleDrillInto(relativePath) {
    setDrillPath((prev) => [...prev, ...relativePath])
  }

  // In tree mode (nothing drilled into yet), opening a note keeps today's
  // modal preview. Once you've drilled into at least a Year, opening a note
  // navigates the page itself instead.
  function handleOpenNote(relativePath) {
    if (drillPath.length === 0) {
      setModalNote(relativePath[relativePath.length - 1].note)
    } else {
      setDrillPath((prev) => [...prev, ...relativePath])
    }
  }

  function goBack() {
    setDrillPath((prev) => prev.slice(0, -1))
  }

  function goToCrumb(index) {
    setDrillPath((prev) => prev.slice(0, index + 1))
  }

  const lastEntry = drillPath[drillPath.length - 1] ?? null
  const viewingNote = lastEntry?.type === 'note' ? lastEntry.note : null
  const currentNodes = drillPath.length === 0 ? tree : viewingNote ? null : lastEntry.children

  // "New note" only makes sense once you're inside a specific Class folder
  // — Semester/Year come from its ancestors in drillPath (drillPath is
  // exactly [year, semester, class] at this point).
  const viewingClass = !viewingNote && lastEntry?.type === 'folder' && lastEntry.level === 'class'
  const newNoteContext = viewingClass
    ? { className: lastEntry.label, semester: drillPath[1]?.label, year: drillPath[0]?.label }
    : null

  async function handleCreateNote(title, date) {
    const res = await fetch('/api/notion/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, ...newNoteContext }),
    })
    if (!res.ok) throw new Error('Could not create this note in Notion.')
    const created = await res.json()
    refresh()
    return created
  }

  return (
    <div className="notes-view">
      <div className="notes-toolbar">
        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {!configured && (
        <p className="empty-state">
          Notion isn&rsquo;t connected yet. Add <code>NOTION_API_KEY</code> and{' '}
          <code>NOTION_DATABASE_ID</code> to the backend&rsquo;s <code>.env</code> and restart the server.
        </p>
      )}

      {configured && error && <p className="dialog-error">{error}</p>}

      {configured && !error && loading && notes.length === 0 && <p className="empty-state">Loading notes…</p>}

      {configured && !error && !loading && notes.length === 0 && (
        <p className="empty-state">No notes found in the Class Notes database yet.</p>
      )}

      {configured && !error && notes.length > 0 && (
        <>
          {drillPath.length > 0 && (
            <div className="notes-nav">
              <button type="button" className="secondary notes-back" onClick={goBack}>
                ← Back
              </button>
              <nav className="notes-breadcrumb" aria-label="Notes breadcrumb">
                <button type="button" onClick={() => setDrillPath([])}>
                  All notes
                </button>
                {drillPath.map((entry, i) => (
                  <Fragment key={entry.key}>
                    <span className="notes-breadcrumb-sep">/</span>
                    <button type="button" onClick={() => goToCrumb(i)} disabled={i === drillPath.length - 1}>
                      {entry.label}
                    </button>
                  </Fragment>
                ))}
              </nav>
              {viewingClass && (
                <button type="button" className="notes-new-note" onClick={() => setNewNoteOpen(true)}>
                  New note
                </button>
              )}
            </div>
          )}

          {viewingNote ? (
            <div className="note-page">
              <h2>{viewingNote.title}</h2>
              <p className="note-page-meta">
                {[viewingNote.className, viewingNote.date && formatDateDisplay(viewingNote.date), viewingNote.semester]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <a className="note-preview-link" href={viewingNote.url} target="_blank" rel="noopener noreferrer">
                Open in Notion →
              </a>
              <div className="note-page-body">
                <NoteContent note={viewingNote} />
              </div>
            </div>
          ) : (
            <NotesTree
              nodes={currentNodes}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onDrillInto={handleDrillInto}
              onOpenNote={handleOpenNote}
            />
          )}
        </>
      )}

      <NotePreview note={modalNote} onClose={() => setModalNote(null)} />
      <NewNoteDialog
        open={newNoteOpen}
        context={newNoteContext || {}}
        onCreate={handleCreateNote}
        onClose={() => setNewNoteOpen(false)}
      />
    </div>
  )
}

// Re-derives a drillPath against a freshly-built tree by following the same
// sequence of keys, truncating at the first segment that no longer exists.
function resolvePath(tree, path) {
  const resolved = []
  let level = tree
  for (const entry of path) {
    const match = level.find((node) => node.key === entry.key)
    if (!match) break
    resolved.push(match)
    level = match.type === 'folder' ? match.children : []
  }
  return resolved
}
