import { useState } from 'react'
import { addDays, formatDayHeaderLabel, formatWeekRangeLabel, monthLabel, startOfWeek } from '../utils/date'
import MonthView from './MonthView'
import TimeGridView from './TimeGridView'
import ConfirmDialog from './ConfirmDialog'

const GRANULARITIES = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
]

export default function CalendarView({ items, onEdit, onDelete }) {
  const [granularity, setGranularity] = useState('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const pendingItem = items.find((item) => item.id === pendingDeleteId)

  function goToday() {
    setAnchorDate(new Date())
  }

  function goPrev() {
    setAnchorDate((prev) => shiftAnchor(prev, granularity, -1))
  }

  function goNext() {
    setAnchorDate((prev) => shiftAnchor(prev, granularity, 1))
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-header-nav">
          <button type="button" className="secondary" onClick={goPrev} aria-label="Previous">&larr;</button>
          <button type="button" className="secondary" onClick={goToday}>Today</button>
          <button type="button" className="secondary" onClick={goNext} aria-label="Next">&rarr;</button>
        </div>

        <h2>{headerLabel(anchorDate, granularity)}</h2>

        <div className="segmented" role="group" aria-label="Calendar view">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              className={granularity === g.value ? 'active' : ''}
              onClick={() => setGranularity(g.value)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {granularity === 'month' ? (
        <MonthView
          items={items}
          anchorDate={anchorDate}
          onEdit={onEdit}
          onRequestDelete={setPendingDeleteId}
        />
      ) : (
        <TimeGridView
          items={items}
          anchorDate={anchorDate}
          days={granularity === 'week' ? 7 : 1}
          onEdit={onEdit}
          onRequestDelete={setPendingDeleteId}
        />
      )}

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
    </div>
  )
}

function shiftAnchor(date, granularity, direction) {
  if (granularity === 'month') {
    return new Date(date.getFullYear(), date.getMonth() + direction, 1)
  }
  if (granularity === 'week') {
    return addDays(date, direction * 7)
  }
  return addDays(date, direction)
}

function headerLabel(date, granularity) {
  if (granularity === 'month') return monthLabel(date.getFullYear(), date.getMonth())
  if (granularity === 'week') {
    const start = startOfWeek(date)
    return formatWeekRangeLabel(start, addDays(start, 6))
  }
  return formatDayHeaderLabel(date)
}
