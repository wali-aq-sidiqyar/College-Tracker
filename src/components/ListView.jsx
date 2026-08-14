import { useState } from 'react'
import { formatDateDisplay, relativeDayLabel, sortByDate } from '../utils/date'
import { formatEstimate } from '../utils/estimate'
import { formatTimeRange } from '../utils/eventTime'
import { typeSlug } from '../utils/itemTypes'
import ConfirmDialog from './ConfirmDialog'

export default function ListView({ items, kind, onEdit, onDelete, onAddRequest }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const sorted = sortByDate(items)
  const pendingItem = sorted.find((item) => item.id === pendingDeleteId)
  const kindLabel = kind === 'task' ? 'task' : 'event'

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

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <button type="button" onClick={() => onAddRequest(kind)}>
          Add {kindLabel}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-state">No {kindLabel}s yet. Add one above.</p>
      ) : (
        <ul className="item-list">
          {sorted.map((item, index) => {
            const relative = relativeDayLabel(item.date)
            const isOverdue = relative.endsWith('ago')
            const estimateLabel = item.kind === 'task' ? formatEstimate(item.estimateAmount, item.estimateUnit) : ''
            const slug = typeSlug(item.type)
            return (
              <li
                key={item.id}
                className={`item-row item-row-${slug}`}
                style={{ '--row-index': index }}
              >
                <div className="item-row-content">
                  <div className="item-row-main">
                    <span className={`item-badge item-badge-${slug}`}>{item.type}</span>
                    <span className="item-title">{item.title}</span>
                    {item.className && <span className="item-class">{item.className}</span>}
                    {estimateLabel && <span className="item-estimate">{estimateLabel}</span>}
                  </div>
                  {item.description && <p className="item-description">{item.description}</p>}
                </div>
                <div className="item-row-actions">
                  <span className="item-date-block">
                    <span className="item-date">{formatDateDisplay(item.date)}</span>
                    {item.kind === 'event' && (
                      <span className="item-time">{formatTimeRange(item.startTime, item.endTime)}</span>
                    )}
                    <span className={`item-relative${isOverdue ? ' item-relative-overdue' : ''}`}>
                      {relative}
                    </span>
                  </span>
                  <button className="ghost" onClick={() => onEdit(item.id)}>Edit</button>
                  <button
                    className="ghost danger"
                    onClick={() => {
                      setPendingDeleteId(item.id)
                      setDeleteError(null)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingItem != null}
        title={`Delete “${pendingItem?.title}”?`}
        description="This can't be undone."
        pending={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
