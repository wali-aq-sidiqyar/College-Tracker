import { buildMonthGrid, todayISO, WEEKDAY_LABELS } from '../utils/date'
import { buildItemSummary, formatTimeCompact, parseTimeToMinutes } from '../utils/eventTime'

export default function MonthView({ items, anchorDate, onEdit, onRequestDelete }) {
  const cells = buildMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth())
  const itemsByDate = groupByDate(items)
  const todayIso = todayISO()

  return (
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
              const summary = buildItemSummary(item)
              const prefix = item.kind === 'event' ? `${formatTimeCompact(item.startTime)} ` : ''
              return (
                <button
                  key={item.id}
                  className={`calendar-chip calendar-chip-${item.type}`}
                  onClick={() => onEdit(item.id)}
                  onDoubleClick={() => onRequestDelete(item.id)}
                  title={`${item.title}${summary ? ' — ' + summary : ''} (double-click to delete)`}
                >
                  {prefix}{item.title}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByDate(items) {
  const map = {}
  for (const item of items) {
    if (!map[item.date]) map[item.date] = []
    map[item.date].push(item)
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'event' ? 1 : -1
      if (a.kind === 'event') return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      return 0
    })
  }
  return map
}
