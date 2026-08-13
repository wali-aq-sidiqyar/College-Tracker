export const ITEM_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'homework', label: 'Homework' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'paper', label: 'Paper' },
  { value: 'project', label: 'Project' },
  { value: 'exam', label: 'Exam' },
]

// Kind is independent of type: a quiz can be a timed in-class Event or a
// take-home Task, an exam usually an Event, homework usually a Task, etc.
export const ITEM_KINDS = [
  { value: 'event', label: 'Event' },
  { value: 'task', label: 'Task' },
]

// Type is free text (a combo box, not a fixed enum), so this turns whatever
// was typed into a safe CSS class suffix: "Assignment" -> "assignment",
// "N/A" -> "n-a", "Lab Report!" -> "lab-report". Anything that doesn't match
// one of the preset type classes just falls back to the base badge/chip
// styling — the same graceful fallback "assignment" already relies on today.
export function typeSlug(type) {
  return (type || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
