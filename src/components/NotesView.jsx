import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { addChild, createFolder, removeNode, renameNode } from '../utils/folderTree'
import FolderTree from './FolderTree'

export default function NotesView() {
  const [folders, setFolders] = useLocalStorage('college-tracker-notes-folders', [])
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [renamingId, setRenamingId] = useState(null)
  const [addingParentId, setAddingParentId] = useState(undefined)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)

  function expand(id) {
    setExpandedIds((prev) => new Set(prev).add(id))
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function startAdd(parentId) {
    if (parentId !== null) expand(parentId)
    setRenamingId(null)
    setConfirmingDeleteId(null)
    setAddingParentId(parentId)
  }

  function handleAdd(parentId, name) {
    setFolders((prev) => addChild(prev, parentId, createFolder(name)))
    setAddingParentId(undefined)
  }

  function startRename(id) {
    setAddingParentId(undefined)
    setConfirmingDeleteId(null)
    setRenamingId(id)
  }

  function handleRename(id, name) {
    setFolders((prev) => renameNode(prev, id, name))
    setRenamingId(null)
  }

  function startDelete(id) {
    setAddingParentId(undefined)
    setRenamingId(null)
    setConfirmingDeleteId(id)
  }

  function handleDelete(id) {
    setFolders((prev) => removeNode(prev, id))
    setConfirmingDeleteId(null)
  }

  const showTree = folders.length > 0 || addingParentId === null

  return (
    <div className="notes-view">
      <div className="notes-toolbar">
        <button type="button" onClick={() => startAdd(null)}>
          New folder
        </button>
      </div>

      {showTree ? (
        <FolderTree
          nodes={folders}
          parentId={null}
          expandedIds={expandedIds}
          onToggle={toggleExpanded}
          renamingId={renamingId}
          onStartRename={startRename}
          onRename={handleRename}
          onCancelRename={() => setRenamingId(null)}
          addingParentId={addingParentId}
          onStartAdd={startAdd}
          onAdd={handleAdd}
          onCancelAdd={() => setAddingParentId(undefined)}
          confirmingDeleteId={confirmingDeleteId}
          onStartDelete={startDelete}
          onDelete={handleDelete}
          onCancelDelete={() => setConfirmingDeleteId(null)}
        />
      ) : (
        <p className="empty-state">No folders yet. Create one to start organizing notes.</p>
      )}
    </div>
  )
}
