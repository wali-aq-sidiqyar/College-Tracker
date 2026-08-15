const UNKNOWN_YEAR = 'Unknown year'
const UNKNOWN_SEMESTER = 'Unknown semester'
const UNKNOWN_CLASS = 'Unknown class'
const NO_DATE = ''

const UNASSIGNED = Symbol('unassigned')
const TERM_ORDER = { fall: 0, winter: 1, spring: 2, summer: 3 }

function groupByKey(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item) || UNASSIGNED
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

// Known-key buckets are ordered by `compare`; the unassigned bucket is
// always appended last, so a note missing a property is never dropped but
// also never mixed in with the ones that have real values.
function orderedEntries(map, fallbackLabel, compare) {
  const entries = [...map.entries()]
    .filter(([key]) => key !== UNASSIGNED)
    .sort(([a], [b]) => compare(a, b))
    .map(([label, items]) => ({ label, items }))
  if (map.has(UNASSIGNED)) {
    entries.push({ label: fallbackLabel, items: map.get(UNASSIGNED) })
  }
  return entries
}

function extractYear(text) {
  const match = String(text).match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function termRank(semester) {
  const match = String(semester).toLowerCase().match(/fall|winter|spring|summer/)
  return match ? TERM_ORDER[match[0]] : 4
}

// "Fall 2026" sorts before "Spring 2027" — by the year embedded in the
// string first (since Semester already carries it), then by academic term
// order within the same year.
function compareSemesters(a, b) {
  const yearA = extractYear(a)
  const yearB = extractYear(b)
  if (yearA !== null && yearB !== null && yearA !== yearB) return yearB - yearA
  return termRank(a) - termRank(b)
}

function compareYears(a, b) {
  const numA = Number(a)
  const numB = Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numB - numA
  return b.localeCompare(a)
}

function sortNotesNewestFirst(notes) {
  return [...notes].sort((a, b) => (b.date || NO_DATE).localeCompare(a.date || NO_DATE))
}

// Builds Year > Semester > Class > notes from the flat list the backend
// returns. The Notion data is flat/tagged — this is the only place the
// nesting gets constructed.
export function buildNotesTree(notes) {
  const byYear = groupByKey(notes, (n) => n.year?.trim())
  return orderedEntries(byYear, UNKNOWN_YEAR, compareYears).map(({ label: year, items: yearNotes }) => ({
    key: `year:${year}`,
    label: year,
    semesters: buildSemesters(yearNotes),
  }))
}

function buildSemesters(notes) {
  const bySemester = groupByKey(notes, (n) => n.semester?.trim())
  return orderedEntries(bySemester, UNKNOWN_SEMESTER, compareSemesters).map(
    ({ label: semester, items: semesterNotes }) => ({
      key: `semester:${semester}`,
      label: semester,
      classes: buildClasses(semesterNotes),
    })
  )
}

function buildClasses(notes) {
  const byClass = groupByKey(notes, (n) => n.className?.trim())
  return orderedEntries(byClass, UNKNOWN_CLASS, (a, b) => a.localeCompare(b)).map(
    ({ label: className, items: classNotes }) => ({
      key: `class:${className}`,
      label: className,
      notes: sortNotesNewestFirst(classNotes),
    })
  )
}
