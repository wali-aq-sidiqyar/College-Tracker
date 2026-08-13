import { useState } from 'react'
import { countDescendants } from '../utils/folderTree'

export default function FolderTree({
  nodes,
  parentId,
  nested = false,
  expandedIds,
  onToggle,
  renamingId,
  onStartRename,
  onRename,
  onCancelRename,
  addingParentId,
  onStartAdd,
  onAdd,
  onCancelAdd,
  confirmingDeleteId,
  onStartDelete,
  onDelete,
  onCancelDelete,
}) {
  return (
    <ul className={`folder-list${nested ? ' folder-list-nested' : ''}`}>
      {addingParentId === parentId && (
        <li className="folder-row">
          <div className="folder-row-main">
            <span className="folder-caret folder-caret-empty" />
            <FolderIcon />
            <FolderNameInput
              placeholder="Folder name"
              onSubmit={(name) => onAdd(parentId, name)}
              onCancel={onCancelAdd}
            />
          </div>
        </li>
      )}

      {nodes.map((node) => {
        const isExpanded = expandedIds.has(node.id)
        const hasChildren = node.children.length > 0
        const isRenaming = renamingId === node.id
        const isConfirmingDelete = confirmingDeleteId === node.id
        const showChildren = isExpanded && (hasChildren || addingParentId === node.id)
        const descendantCount = isConfirmingDelete ? countDescendants(node) : 0

        return (
          <li key={node.id} className="folder-row">
            <div className="folder-row-main">
              <button
                type="button"
                className={`folder-caret${hasChildren ? '' : ' folder-caret-empty'}${isExpanded ? ' expanded' : ''}`}
                onClick={() => hasChildren && onToggle(node.id)}
                tabIndex={hasChildren ? 0 : -1}
                aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
              >
                {hasChildren && <CaretIcon />}
              </button>

              <FolderIcon />

              {isRenaming ? (
                <FolderNameInput
                  initialValue={node.name}
                  onSubmit={(name) => onRename(node.id, name)}
                  onCancel={onCancelRename}
                />
              ) : (
                <button type="button" className="folder-name" onClick={() => onToggle(node.id)}>
                  {node.name}
                </button>
              )}

              {!isRenaming && !isConfirmingDelete && (
                <div className="folder-row-actions">
                  <button type="button" className="ghost" onClick={() => onStartAdd(node.id)}>
                    Add
                  </button>
                  <button type="button" className="ghost" onClick={() => onStartRename(node.id)}>
                    Rename
                  </button>
                  <button type="button" className="ghost danger" onClick={() => onStartDelete(node.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>

            {isConfirmingDelete && (
              <div className="folder-delete-confirm">
                <span>
                  Delete &ldquo;{node.name}&rdquo;
                  {descendantCount > 0
                    ? ` and its ${descendantCount} subfolder${descendantCount === 1 ? '' : 's'}`
                    : ''}
                  ? This can&rsquo;t be undone.
                </span>
                <div className="folder-delete-confirm-actions">
                  <button type="button" className="danger-solid" onClick={() => onDelete(node.id)}>
                    Delete
                  </button>
                  <button type="button" className="secondary" onClick={onCancelDelete}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showChildren && (
              <FolderTree
                nodes={node.children}
                parentId={node.id}
                nested
                expandedIds={expandedIds}
                onToggle={onToggle}
                renamingId={renamingId}
                onStartRename={onStartRename}
                onRename={onRename}
                onCancelRename={onCancelRename}
                addingParentId={addingParentId}
                onStartAdd={onStartAdd}
                onAdd={onAdd}
                onCancelAdd={onCancelAdd}
                confirmingDeleteId={confirmingDeleteId}
                onStartDelete={onStartDelete}
                onDelete={onDelete}
                onCancelDelete={onCancelDelete}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function FolderNameInput({ initialValue = '', placeholder, onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue)

  function commit() {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
    else onCancel()
  }

  return (
    <input
      type="text"
      className="folder-name-input"
      value={value}
      placeholder={placeholder}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      onBlur={commit}
    />
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
