import { useState } from 'react'
import { formatDateDisplay, relativeDayLabel, sortByDate } from '../utils/date'
import { formatEstimate } from '../utils/estimate'
import { formatTimeRange } from '../utils/eventTime'
import ConfirmDialog from './ConfirmDialog'

export default function ListView({ items, onEdit, onDelete }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const sorted = sortByDate(items)
  const pendingItem = sorted.find((item) => item.id === pendingDeleteId)

  if (sorted.length === 0) {
    return <p className="empty-state">Nothing here yet. Add an item above.</p>
  }

  return (
    <ul className="item-list">
      {sorted.map((item, index) => {
        const relative = relativeDayLabel(item.date)
        const isOverdue = relative.endsWith('ago')
        const estimateLabel = item.kind === 'task' ? formatEstimate(item.estimateAmount, item.estimateUnit) : ''
        return (
          <li
            key={item.id}
            className={`item-row item-row-${item.type}`}
            style={{ '--row-index': index }}
          >
            <div className="item-row-content">
              <div className="item-row-main">
                <span className={`item-badge item-badge-${item.type}`}>{item.type}</span>
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
              <button className="ghost danger" onClick={() => setPendingDeleteId(item.id)}>
                Delete
              </button>
            </div>
          </li>
        )
      })}

      <ConfirmDialog
        open={pendingItem != null}
        title={`Delete “${pendingItem?.title}”?`}
        description="This can't be undone."
        onConfirm={() => {
          onDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </ul>
  )
}
