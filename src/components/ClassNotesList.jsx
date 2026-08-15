import { formatDateDisplay } from '../utils/date'
import { useBulkSelectDelete } from '../hooks/useBulkSelectDelete'
import ConfirmDialog from './ConfirmDialog'

// The flat, individually-checkable list of notes inside a drilled-in Class
// folder — the one place in Notes where selection + bulk delete apply,
// mirroring the Tasks/Events list pattern exactly (same hook, same dialog).
export default function ClassNotesList({ notes, onOpenNote, onDeleteNote }) {
  const bulk = useBulkSelectDelete(notes, onDeleteNote)
  const pendingNote = notes.find((note) => note.id === bulk.pendingDeleteId)

  return (
    <>
      <div className="list-bulk-bar">
        <label className="list-bulk-select-all">
          <input
            type="checkbox"
            className="checkbox"
            checked={bulk.allSelected}
            onChange={bulk.toggleSelectAll}
            disabled={bulk.deleting || bulk.bulkPending}
          />
          Select all
        </label>
        <span className="list-bulk-count">{bulk.selectedCount} selected</span>
        <button
          type="button"
          className="danger-solid"
          disabled={bulk.selectedCount === 0 || bulk.deleting || bulk.bulkPending}
          onClick={bulk.openBulkDelete}
        >
          Delete selected
        </button>
      </div>

      <ul className="notes-list">
        {notes.map((note) => (
          <li key={note.id} className="notes-row">
            <div className="notes-row-main">
              <label className="item-row-select" title={`Select ${note.title}`}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={bulk.selectedIds.has(note.id)}
                  onChange={() => bulk.toggleSelect(note.id)}
                  disabled={bulk.bulkPending}
                  aria-label={`Select ${note.title}`}
                />
              </label>
              <button type="button" className="notes-row-body notes-row-body-note" onClick={() => onOpenNote(note)}>
                <NoteIcon />
                <span className="notes-row-label">{note.title}</span>
                {note.date && <span className="notes-row-date">{formatDateDisplay(note.date)}</span>}
              </button>
              <button
                type="button"
                className="ghost danger"
                onClick={() => bulk.requestDelete(note.id)}
                disabled={bulk.bulkPending}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingNote != null}
        title={`Delete “${pendingNote?.title}”?`}
        description="This archives it in Notion — it moves to Notion's trash and can be recovered there, not permanently deleted."
        pending={bulk.deleting}
        error={bulk.deleteError}
        onConfirm={bulk.confirmDelete}
        onCancel={bulk.cancelDelete}
      />

      {bulk.bulkSnapshot && (
        <ConfirmDialog
          open={bulk.bulkOpen}
          wide
          title={
            bulk.bulkResult
              ? 'Bulk delete stopped'
              : `Delete ${bulk.bulkSnapshot.items.length} note${bulk.bulkSnapshot.items.length === 1 ? '' : 's'}?`
          }
          description={
            bulk.bulkResult
              ? null
              : `This archives ${bulk.bulkSnapshot.items.length} note${bulk.bulkSnapshot.items.length === 1 ? '' : 's'} in Notion — they move to Notion's trash and can be recovered there, not permanently deleted.`
          }
          confirmLabel="Delete"
          cancelLabel={bulk.bulkResult ? 'Close' : 'Cancel'}
          pending={bulk.bulkPending}
          hideConfirm={Boolean(bulk.bulkResult)}
          onConfirm={bulk.confirmBulkDelete}
          onCancel={bulk.closeBulkDialog}
        >
          {bulk.bulkResult ? (
            <div className="dialog-bulk-report">
              {bulk.bulkResult.succeededTitles.length > 0 && (
                <p className="dialog-bulk-line">
                  Deleted ({bulk.bulkResult.succeededTitles.length}): {bulk.bulkResult.succeededTitles.join(', ')}
                </p>
              )}
              <p className="dialog-error">
                Stopped — couldn&rsquo;t delete &ldquo;{bulk.bulkResult.failedTitle}&rdquo;: {bulk.bulkResult.message}
              </p>
              {bulk.bulkResult.notAttemptedTitles.length > 0 && (
                <p className="dialog-bulk-line">
                  Not attempted ({bulk.bulkResult.notAttemptedTitles.length}): {bulk.bulkResult.notAttemptedTitles.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <ul className="dialog-item-list">
              {bulk.bulkSnapshot.items.map((note) => (
                <li key={note.id}>
                  <span className="dialog-item-title">{note.title}</span>
                  <span className="dialog-item-meta">{note.date && formatDateDisplay(note.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </ConfirmDialog>
      )}
    </>
  )
}

function NoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}
