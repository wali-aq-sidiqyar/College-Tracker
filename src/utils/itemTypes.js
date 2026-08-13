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
