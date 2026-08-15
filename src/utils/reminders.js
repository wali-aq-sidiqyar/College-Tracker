// A reminder's date/time as a real Date, or null for a fully timeless one.
// A date with no time sorts/compares as the start of that day.
export function reminderDateTime(reminder) {
  if (!reminder.date) return null
  const [year, month, day] = reminder.date.split('-').map(Number)
  if (reminder.time) {
    const [hour, minute] = reminder.time.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
  }
  return new Date(year, month - 1, day)
}

// Display-only — a reminder is never auto-deleted or alerted on, just
// flagged. A timed reminder is overdue once that moment passes; a
// date-only reminder stays "not overdue" until the whole day has elapsed
// (matches how past *events* are judged by their end time, not start).
export function isReminderOverdue(reminder, now = new Date()) {
  const dt = reminderDateTime(reminder)
  if (!dt) return false
  if (reminder.time) return dt < now
  const endOfDay = new Date(dt)
  endOfDay.setDate(endOfDay.getDate() + 1)
  return endOfDay <= now
}

// Splits into dated reminders (soonest-first) and timeless ones, which
// group separately rather than being interleaved.
export function groupReminders(reminders) {
  const scheduled = []
  const timeless = []
  for (const reminder of reminders) {
    if (reminder.date) scheduled.push(reminder)
    else timeless.push(reminder)
  }
  scheduled.sort((a, b) => reminderDateTime(a) - reminderDateTime(b))
  return { scheduled, timeless }
}
