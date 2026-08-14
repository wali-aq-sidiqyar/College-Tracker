import { formatDateDisplay, relativeDayLabel } from '../utils/date'
import { formatEstimate } from '../utils/estimate'
import { formatTimeRange } from '../utils/eventTime'
import { typeSlug } from '../utils/itemTypes'

// A single dated task/event row — shared by the Tasks list and the Events
// list (both the one-time section and any expanded recurring occurrences),
// so selection, editing, and deleting behave identically everywhere. The
// completion checkbox is optional (only Tasks pass onToggleComplete).
export default function ItemRow({
  item,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onRequestDelete,
  disabled,
  completed,
  onToggleComplete,
  completing,
}) {
  const relative = relativeDayLabel(item.date)
  const isOverdue = relative.endsWith('ago')
  const estimateLabel = item.kind === 'task' ? formatEstimate(item.estimateAmount, item.estimateUnit) : ''
  const slug = typeSlug(item.type)

  return (
    <li
      className={`item-row item-row-${slug}${completed ? ' item-row-completed' : ''}`}
      style={{ '--row-index': index }}
    >
      <label className="item-row-select">
        <input
          type="checkbox"
          className="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          disabled={disabled}
          aria-label={`Select ${item.title}`}
        />
      </label>
      <div className="item-row-content">
        <div className="item-row-main">
          {onToggleComplete && (
            <label className="item-row-complete">
              <input
                type="checkbox"
                className="checkbox checkbox-complete"
                checked={Boolean(completed)}
                onChange={() => onToggleComplete(item.id)}
                disabled={completing}
                aria-label={completed ? `Mark ${item.title} as not done` : `Mark ${item.title} as done`}
              />
            </label>
          )}
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
        <button className="ghost danger" onClick={() => onRequestDelete(item.id)}>
          Delete
        </button>
      </div>
    </li>
  )
}
