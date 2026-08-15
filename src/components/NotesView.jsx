import { useMemo, useState } from 'react'
import { useNotionNotes } from '../hooks/useNotionNotes'
import { buildNotesTree } from '../utils/notesTree'
import NotesTree from './NotesTree'
import NotePreview from './NotePreview'

export default function NotesView() {
  const { notes, loading, error, configured, refresh } = useNotionNotes()
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [openNote, setOpenNote] = useState(null)

  const tree = useMemo(() => buildNotesTree(notes), [notes])

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
        <NotesTree tree={tree} expandedIds={expandedIds} onToggle={toggleExpanded} onOpenNote={setOpenNote} />
      )}

      <NotePreview note={openNote} onClose={() => setOpenNote(null)} />
    </div>
  )
}
