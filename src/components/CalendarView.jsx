import { useState } from 'react'
import { buildMonthGrid, monthLabel, todayISO, WEEKDAY_LABELS } from '../utils/date'
import { formatEstimate } from '../utils/estimate'

export default function CalendarView({ items, onEdit, onDelete }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const cells = buildMonthGrid(year, month)
  const itemsByDate = groupByDate(items)
  const todayIso = todayISO()

  function goToPrevMonth() {
    const date = new Date(year, month - 1, 1)
    setYear(date.getFullYear())
    setMonth(date.getMonth())
  }

  function goToNextMonth() {
    const date = new Date(year, month + 1, 1)
    setYear(date.getFullYear())
    setMonth(date.getMonth())
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="secondary" onClick={goToPrevMonth}>&larr; Prev</button>
        <h2>{monthLabel(year, month)}</h2>
        <button className="secondary" onClick={goToNextMonth}>Next &rarr;</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}

        {cells.map((cell) => (
          <div
            key={cell.iso}
            className={[
              'calendar-cell',
              cell.inCurrentMonth ? '' : 'calendar-cell-outside',
              cell.iso === todayIso ? 'calendar-cell-today' : '',
            ].join(' ').trim()}
          >
            <span className="calendar-cell-daynum">{cell.date.getDate()}</span>
            <div className="calendar-cell-items">
              {(itemsByDate[cell.iso] || []).map((item) => {
                const estimateLabel = formatEstimate(item.estimateAmount, item.estimateUnit)
                const details = [
                  item.className,
                  estimateLabel,
                  item.description,
                ].filter(Boolean).join(' — ')
                return (
                  <button
                    key={item.id}
                    className={`calendar-chip calendar-chip-${item.type}`}
                    onClick={() => onEdit(item.id)}
                    onDoubleClick={() => onDelete(item.id)}
                    title={`${item.title}${details ? ' — ' + details : ''} (double-click to delete)`}
                  >
                    {item.title}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function groupByDate(items) {
  const map = {}
  for (const item of items) {
    if (!map[item.date]) map[item.date] = []
    map[item.date].push(item)
  }
  return map
}
