import { addDays, toISODate } from './date'

// Google Calendar -> app item shape, so Google events can flow through the
// same CalendarView/ListView/ItemForm components local items already use.
// `source: 'google'` + `googleId` mark it so App.jsx routes saves/deletes
// to the backend instead of localStorage.
export function googleEventToItem(event) {
  const allDay = Boolean(event.start?.date)
  const props = event.extendedProperties?.private || {}

  return {
    id: `google-${event.id}`,
    googleId: event.id,
    source: 'google',
    kind: allDay ? 'task' : 'event',
    // Events created directly in Google (not through this app) have no
    // stored appType — 'N/A' matches the app's existing "no category set"
    // convention (same value ItemForm falls back to for a blank Type
    // field) rather than inventing a fake category out of the source.
    type: props.appType || 'N/A',
    title: event.summary || '(Untitled event)',
    className: props.appClassName || '',
    date: allDay ? event.start.date : toISODate(new Date(event.start.dateTime)),
    startTime: allDay ? '' : toHHMM(event.start.dateTime),
    endTime: allDay ? '' : toHHMM(event.end.dateTime),
    description: event.description || '',
    estimateAmount: '',
    estimateUnit: 'min',
  }
}

// App item -> Google Calendar event body, for create/update. Stashes our
// app-only fields (type, className) in extendedProperties so a round trip
// through Google doesn't lose them.
export function itemToGoogleEvent(item) {
  const extendedProperties = {
    private: { appType: item.type || '', appClassName: item.className || '' },
  }

  if (item.kind === 'task' || !item.startTime || !item.endTime) {
    // Google represents all-day events with an exclusive end date, so a
    // single-day event needs end.date one day after start.date.
    const endDate = toISODate(addDays(new Date(`${item.date}T00:00:00`), 1))
    return {
      summary: item.title,
      description: item.description || undefined,
      start: { date: item.date },
      end: { date: endDate },
      extendedProperties,
    }
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    summary: item.title,
    description: item.description || undefined,
    start: { dateTime: `${item.date}T${item.startTime}:00`, timeZone },
    end: { dateTime: `${item.date}T${item.endTime}:00`, timeZone },
    extendedProperties,
  }
}

function toHHMM(dateTimeStr) {
  const d = new Date(dateTimeStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
