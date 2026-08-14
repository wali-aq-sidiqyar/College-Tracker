import { formatEstimate } from './estimate'

export function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// "14:00" -> "2 PM", "14:30" -> "2:30 PM"
export function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatTimeRange(startTime, endTime) {
  return `${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`
}

// Compact month-chip prefix, Google Calendar style: "14:00" -> "2p", "14:30" -> "2:30p"
export function formatTimeCompact(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'a' : 'p'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`
}

// Cutoff is the event's END time, not start — an event currently in
// progress shouldn't disappear from an "upcoming" list mid-way through.
export function hasEventEnded(item, now = new Date()) {
  const [year, month, day] = item.date.split('-').map(Number)
  const [hour, minute] = item.endTime.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute) < now
}

export function buildItemSummary(item) {
  const parts = [
    item.className,
    item.kind === 'event' ? formatTimeRange(item.startTime, item.endTime) : null,
    item.kind === 'task' ? formatEstimate(item.estimateAmount, item.estimateUnit) : null,
    item.description,
  ]
  return parts.filter(Boolean).join(' — ')
}

// Forgiving digit parsing, so short entry auto-corrects instead of needing
// exactly 4 digits: "3" -> hour 3 :00, "12" -> hour 12 :00, "330" -> 3:30,
// "1230" -> 12:30. Returns null while empty or out of range.
function interpretDigits(digits) {
  if (!digits) return null
  let hour12
  let minute
  if (digits.length <= 2) {
    hour12 = Number(digits)
    minute = 0
  } else if (digits.length === 3) {
    hour12 = Number(digits.slice(0, 1))
    minute = Number(digits.slice(1, 3))
  } else {
    hour12 = Number(digits.slice(0, 2))
    minute = Number(digits.slice(2, 4))
  }
  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) return null
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  return { hour12, minute }
}

// Typed digits + 'PM'/'AM' -> "14:30" 24-hour, matching the stored/parsed
// format used everywhere else. Returns null while empty or out of range.
export function parseTypedTime(digits, period) {
  const parsed = interpretDigits(digits)
  if (!parsed) return null
  const hour24 = period === 'PM' ? (parsed.hour12 % 12) + 12 : parsed.hour12 % 12
  return `${String(hour24).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`
}

// Colon-formatted preview of typed digits, shown once the field isn't
// focused: "330" -> "3:30", "12" -> "12:00". Falls back to the raw digits
// while incomplete/invalid so nothing looks broken mid-entry.
export function formatTypedDigitsDisplay(digits) {
  const parsed = interpretDigits(digits)
  if (!parsed) return digits
  return `${parsed.hour12}:${String(parsed.minute).padStart(2, '0')}`
}

// "14:30" -> { digits: "0230", period: "PM" }, for prefilling TimeEntryInput.
export function splitTypedTime(hhmm) {
  if (!hhmm) return { digits: '', period: 'AM' }
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { digits: `${String(hour12).padStart(2, '0')}${String(m).padStart(2, '0')}`, period }
}

// Assigns each event a column + total-column count so same-day overlapping
// events render side by side instead of stacking illegibly. Events that
// don't overlap anything get the full column width.
export function layoutDayEvents(events) {
  const sorted = [...events].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
  )
  const placements = []
  let cluster = []
  let clusterEnd = -Infinity

  function flushCluster() {
    if (cluster.length === 0) return
    const columnEnds = []
    const columnByEvent = []
    for (const ev of cluster) {
      let col = columnEnds.findIndex((end) => end <= ev.startMinutes)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(ev.endMinutes)
      } else {
        columnEnds[col] = ev.endMinutes
      }
      columnByEvent.push(col)
    }
    const totalColumns = columnEnds.length
    cluster.forEach((ev, i) => {
      placements.push({ event: ev, col: columnByEvent[i], totalColumns })
    })
    cluster = []
  }

  for (const ev of sorted) {
    if (cluster.length === 0 || ev.startMinutes < clusterEnd) {
      cluster.push(ev)
      clusterEnd = Math.max(clusterEnd, ev.endMinutes)
    } else {
      flushCluster()
      cluster = [ev]
      clusterEnd = ev.endMinutes
    }
  }
  flushCluster()

  return placements
}
