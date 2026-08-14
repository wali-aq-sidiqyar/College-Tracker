import { useState } from 'react'

// Shared selection + single/bulk delete state for a list of items, used by
// both the Tasks list and the Events list. `selectableItems` should be
// whatever's currently rendered as an individually-checkable row — for
// Events that's one-time items plus any expanded recurring occurrences,
// which changes as the user expands/collapses groups; this hook doesn't
// need to know why, it just works off whatever's passed each render.
export function useBulkSelectDelete(selectableItems, onDelete) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSnapshot, setBulkSnapshot] = useState(null) // frozen at confirm-open time
  const [bulkPending, setBulkPending] = useState(false)
  const [bulkResult, setBulkResult] = useState(null) // failure report, or null while previewing

  const selectedCount = selectableItems.filter((item) => selectedIds.has(item.id)).length
  const allSelected = selectableItems.length > 0 && selectableItems.every((item) => selectedIds.has(item.id))

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableItems.map((item) => item.id)))
  }

  function requestDelete(id) {
    setPendingDeleteId(id)
    setDeleteError(null)
  }

  function cancelDelete() {
    setPendingDeleteId(null)
    setDeleteError(null)
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(pendingDeleteId)
      // Only dismiss the dialog once the delete is actually confirmed —
      // on failure it stays open with the error, and the item stays put.
      setPendingDeleteId(null)
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this item. Nothing was lost — try again.')
    } finally {
      setDeleting(false)
    }
  }

  // Freeze exactly which items are being deleted the moment the dialog
  // opens — the loop below only ever touches this fixed list, never a
  // freshly-recomputed selection, so nothing beyond what was seen and
  // confirmed can be deleted.
  function openBulkDelete() {
    const targets = selectableItems.filter((item) => selectedIds.has(item.id))
    const googleCount = targets.filter((item) => item.source === 'google').length
    setBulkSnapshot({ items: targets, googleCount, localCount: targets.length - googleCount })
    setBulkResult(null)
    setBulkOpen(true)
  }

  function closeBulkDialog() {
    setBulkOpen(false)
    setBulkSnapshot(null)
    setBulkResult(null)
  }

  async function confirmBulkDelete() {
    setBulkPending(true)
    setBulkResult(null)
    const targets = bulkSnapshot.items
    const succeededTitles = []

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i]
      try {
        await onDelete(item.id)
        succeededTitles.push(item.title)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } catch (err) {
        // Stop immediately — don't attempt the rest — and report exactly
        // what happened so far rather than leaving the outcome unclear.
        setBulkResult({
          failedTitle: item.title,
          message: err.message || 'Could not delete this item.',
          succeededTitles,
          notAttemptedTitles: targets.slice(i + 1).map((t) => t.title),
        })
        setBulkPending(false)
        return
      }
    }

    setBulkPending(false)
    closeBulkDialog()
  }

  return {
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    pendingDeleteId,
    deleting,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
    bulkOpen,
    bulkSnapshot,
    bulkPending,
    bulkResult,
    openBulkDelete,
    closeBulkDialog,
    confirmBulkDelete,
  }
}
