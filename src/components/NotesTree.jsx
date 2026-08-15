import { formatDateDisplay } from '../utils/date'

// Read-only tree — Year > Semester > Class > notes — built from whatever the
// Notion database returns. Nothing here creates, renames, or deletes; that's
// all done in Notion itself.
export default function NotesTree({ tree, expandedIds, onToggle, onOpenNote }) {
  return (
    <ul className="folder-list">
      {tree.map((year) => (
        <FolderNode key={year.key} id={year.key} label={year.label} expandedIds={expandedIds} onToggle={onToggle}>
          <ul className="folder-list folder-list-nested">
            {year.semesters.map((semester) => (
              <FolderNode
                key={semester.key}
                id={semester.key}
                label={semester.label}
                expandedIds={expandedIds}
                onToggle={onToggle}
              >
                <ul className="folder-list folder-list-nested">
                  {semester.classes.map((cls) => (
                    <FolderNode
                      key={cls.key}
                      id={cls.key}
                      label={cls.label}
                      expandedIds={expandedIds}
                      onToggle={onToggle}
                    >
                      <ul className="folder-list folder-list-nested">
                        {cls.notes.map((note) => (
                          <NoteRow key={note.id} note={note} onOpenNote={onOpenNote} />
                        ))}
                      </ul>
                    </FolderNode>
                  ))}
                </ul>
              </FolderNode>
            ))}
          </ul>
        </FolderNode>
      ))}
    </ul>
  )
}

function FolderNode({ id, label, expandedIds, onToggle, children }) {
  const isExpanded = expandedIds.has(id)
  return (
    <li className="folder-row">
      <div className="folder-row-main">
        <button
          type="button"
          className={`folder-caret${isExpanded ? ' expanded' : ''}`}
          onClick={() => onToggle(id)}
          aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
        >
          <CaretIcon />
        </button>
        <FolderIcon />
        <button type="button" className="folder-name" onClick={() => onToggle(id)}>
          {label}
        </button>
      </div>
      {isExpanded && children}
    </li>
  )
}

function NoteRow({ note, onOpenNote }) {
  return (
    <li className="folder-row">
      <div className="folder-row-main note-row-main" onClick={() => onOpenNote(note)}>
        <span className="folder-caret folder-caret-empty" />
        <NoteIcon />
        <button type="button" className="folder-name note-name">
          {note.title}
        </button>
        {note.date && <span className="note-row-date">{formatDateDisplay(note.date)}</span>}
      </div>
    </li>
  )
}

function CaretIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}
