import { formatDateDisplay } from '../utils/date'

// Recursive, uniform row renderer for the Year > Semester > Class > note
// tree. Every folder row has two independent controls: the caret expands
// its children in place (stays in this same list), while clicking the row
// body itself reports the full path from this render's root down to the
// clicked node — NotesView uses that to drill in. `path` accumulates the
// ancestors as we recurse, so a folder revealed three levels deep via
// expand-in-place still reports its true full ancestry when clicked.
export default function NotesTree({ nodes, path = [], expandedIds, onToggle, onDrillInto, onOpenNote }) {
  return (
    <ul className="notes-list">
      {nodes.map((node) => (
        <NodeRow
          key={node.key}
          node={node}
          path={path}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onDrillInto={onDrillInto}
          onOpenNote={onOpenNote}
        />
      ))}
    </ul>
  )
}

function NodeRow({ node, path, expandedIds, onToggle, onDrillInto, onOpenNote }) {
  const childPath = [...path, node]

  if (node.type === 'note') {
    return (
      <li className="notes-row">
        <div className="notes-row-main">
          <span className="notes-row-caret notes-row-caret-empty" aria-hidden="true" />
          <button type="button" className="notes-row-body notes-row-body-note" onClick={() => onOpenNote(childPath)}>
            <NoteIcon />
            <span className="notes-row-label">{node.label}</span>
            {node.note.date && <span className="notes-row-date">{formatDateDisplay(node.note.date)}</span>}
          </button>
        </div>
      </li>
    )
  }

  const isExpanded = expandedIds.has(node.key)
  return (
    <li className="notes-row">
      <div className="notes-row-main">
        <button
          type="button"
          className={`notes-row-caret${isExpanded ? ' expanded' : ''}`}
          onClick={() => onToggle(node.key)}
          aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
        >
          <CaretIcon />
        </button>
        <button type="button" className="notes-row-body" onClick={() => onDrillInto(childPath)}>
          <FolderIcon />
          <span className="notes-row-label">{node.label}</span>
          <span className="notes-row-count">
            {node.count} {node.count === 1 ? 'note' : 'notes'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="notes-row-children">
          <NotesTree
            nodes={node.children}
            path={childPath}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onDrillInto={onDrillInto}
            onOpenNote={onOpenNote}
          />
        </div>
      )}
    </li>
  )
}

function CaretIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
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
