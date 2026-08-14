import { sortByDate, todayISO, WEEKDAY_LABELS } from './date'
import { formatTimeRange } from './eventTime'

// Displaying a class schedule reads naturally Monday-first ("Mon/Wed/Fri"),
// unlike the app's Sunday-first calendar grid — a distinct order just for
// this summary text.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

// Splits event items into one-time (no recurringEventId) and recurring
// (grouped by recurringEventId, one summary per series). Local items never
// have recurringEventId — recurrence is a Google-only concept — so they
// always land in the one-time bucket.
export function groupRecurringEvents(items) {
  const oneTime = []
  const seriesMap = new Map()

  for (const item of items) {
    if (item.recurringEventId) {
      if (!seriesMap.has(item.recurringEventId)) seriesMap.set(item.recurringEventId, [])
      seriesMap.get(item.recurringEventId).push(item)
    } else {
      oneTime.push(item)
    }
  }

  const today = todayISO()
  const recurringGroups = [...seriesMap.values()].map((occurrences) => {
    const sorted = sortByDate(occurrences)
    return {
      recurringEventId: sorted[0].recurringEventId,
      occurrences: sorted,
      pattern: describePattern(sorted),
      nextDate: sorted.find((item) => item.date >= today)?.date ?? sorted[sorted.length - 1].date,
    }
  })
  recurringGroups.sort((a, b) => a.nextDate.localeCompare(b.nextDate))

  return { oneTime: sortByDate(oneTime), recurringGroups }
}

// Empirical, not RRULE-based: summarizes the occurrences already fetched
// (a few months back/forward) rather than parsing Google's recurrence
// rule. For a real class schedule that window almost always fully covers
// the pattern, but a series with an unusual gap right at the edge of it —
// or one that just started this week — could show an incomplete-looking
// pattern until more occurrences roll into view.
function describePattern(occurrences) {
  const weekdays = new Set()
  const timeRanges = new Set()

  for (const item of occurrences) {
    const [year, month, day] = item.date.split('-').map(Number)
    weekdays.add(new Date(year, month - 1, day).getDay())
    timeRanges.add(`${item.startTime}-${item.endTime}`)
  }

  const weekdayText = WEEKDAY_ORDER.filter((day) => weekdays.has(day))
    .map((day) => WEEKDAY_LABELS[day])
    .join('/')

  if (timeRanges.size !== 1) return `${weekdayText} · time varies`

  const { startTime, endTime } = occurrences[0]
  return `${weekdayText} ${formatTimeRange(startTime, endTime)}`
}
