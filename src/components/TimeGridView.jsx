import { useEffect, useRef } from 'react'
import { addDays, startOfWeek, toISODate, todayISO, WEEKDAY_LABELS } from '../utils/date'
import {
  buildItemSummary,
  formatTimeRange,
  layoutDayEvents,
  parseTimeToMinutes,
} from '../utils/eventTime'
import { typeSlug } from '../utils/itemTypes'

const HOUR_HEIGHT = 48
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const DEFAULT_SCROLL_HOUR = 7

export default function TimeGridView({ items, anchorDate, days, onEdit, onRequestDelete }) {
  const bodyRef = useRef(null)
  const todayIso = todayISO()

  const dayDates = days === 7
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchorDate), i))
    : [anchorDate]

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_HEIGHT
    }
  }, [])

  return (
    <div
      className="time-grid hud-frame"
      style={{ '--hour-height': `${HOUR_HEIGHT}px`, '--day-columns': days }}
    >
      <div className="time-grid-header">
        <div className="time-grid-gutter-spacer" />
        {dayDates.map((date) => {
          const iso = toISODate(date)
          return (
            <div key={iso} className={`time-grid-day-label${iso === todayIso ? ' today' : ''}`}>
              <span className="time-grid-day-weekday">{WEEKDAY_LABELS[date.getDay()]}</span>
              <span className="time-grid-day-num">{date.getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className="time-grid-allday">
        <div className="time-grid-gutter-spacer">All day</div>
        {dayDates.map((date) => {
          const iso = toISODate(date)
          const tasks = items.filter((item) => item.date === iso && item.kind === 'task')
          return (
            <div key={iso} className="time-grid-allday-cell">
              {tasks.map((task) => {
                const summary = buildItemSummary(task)
                return (
                  <button
                    key={task.id}
                    className={`calendar-chip calendar-chip-${typeSlug(task.type)}`}
                    onClick={() => onEdit(task.id)}
                    onDoubleClick={() => onRequestDelete(task.id)}
                    title={`${task.title}${summary ? ' — ' + summary : ''} (double-click to delete)`}
                  >
                    {task.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="time-grid-body" ref={bodyRef}>
        <div className="time-grid-gutter">
          {HOURS.map((h) => (
            <div key={h} className="time-grid-hour-label">{formatHourLabel(h)}</div>
          ))}
        </div>

        {dayDates.map((date) => {
          const iso = toISODate(date)
          const dayEvents = items
            .filter((item) => item.date === iso && item.kind === 'event')
            .map((item) => {
              const startMinutes = parseTimeToMinutes(item.startTime)
              const endMinutes = Math.min(
                24 * 60,
                Math.max(parseTimeToMinutes(item.endTime), startMinutes + 15)
              )
              return { ...item, startMinutes, endMinutes }
            })
          const placements = layoutDayEvents(dayEvents)

          return (
            <div key={iso} className={`time-grid-day-column${iso === todayIso ? ' today' : ''}`}>
              {HOURS.map((h) => (
                <div key={h} className="time-grid-hour-row" />
              ))}
              {placements.map(({ event, col, totalColumns }) => {
                const summary = buildItemSummary(event)
                return (
                  <button
                    key={event.id}
                    className={`time-block time-block-${typeSlug(event.type)}`}
                    style={{
                      top: `${(event.startMinutes / 60) * HOUR_HEIGHT}px`,
                      height: `${((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT}px`,
                      left: `${(col / totalColumns) * 100}%`,
                      width: `calc(${100 / totalColumns}% - 2px)`,
                    }}
                    onClick={() => onEdit(event.id)}
                    onDoubleClick={() => onRequestDelete(event.id)}
                    title={`${event.title}${summary ? ' — ' + summary : ''} (double-click to delete)`}
                  >
                    <span className="time-block-title">{event.title}</span>
                    <span className="time-block-time">{formatTimeRange(event.startTime, event.endTime)}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatHourLabel(hour) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}
