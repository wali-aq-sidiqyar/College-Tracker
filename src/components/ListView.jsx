import { formatDateDisplay, sortByDate } from '../utils/date'

export default function ListView({ items, onEdit, onDelete }) {
  const sorted = sortByDate(items)

  if (sorted.length === 0) {
    return <p className="empty-state">Nothing here yet. Add an assignment or exam above.</p>
  }

  return (
    <ul className="item-list">
      {sorted.map((item) => (
        <li key={item.id} className={`item-row item-row-${item.type}`}>
          <div className="item-row-main">
            <span className="item-badge">{item.type}</span>
            <span className="item-title">{item.title}</span>
            {item.className && <span className="item-class">{item.className}</span>}
          </div>
          <div className="item-row-actions">
            <span className="item-date">{formatDateDisplay(item.date)}</span>
            <button onClick={() => onEdit(item.id)}>Edit</button>
            <button className="secondary" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
