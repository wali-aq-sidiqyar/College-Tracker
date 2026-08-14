import { sortByDate } from './date'

const UNASSIGNED = Symbol('unassigned')

export function groupTasksByClass(items) {
  return groupBy(items, (item) => item.className?.trim(), 'No class')
}

export function groupTasksByType(items) {
  // 'N/A' is this app's existing "no category set" sentinel (same value
  // Google-native tasks and a blank Type field both fall back to), so it
  // means the same thing as "no type" here too.
  return groupBy(
    items,
    (item) => {
      const type = item.type?.trim()
      return type && type.toUpperCase() !== 'N/A' ? type : ''
    },
    'Unassigned'
  )
}

// Buckets items by whatever `keyFn` returns, sorts named buckets
// alphabetically, sorts each bucket's items by date, and always puts the
// "nothing set" bucket last under `fallbackLabel` — present whenever it has
// at least one item, never silently dropped.
function groupBy(items, keyFn, fallbackLabel) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item) || UNASSIGNED
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }

  const groups = [...map.entries()]
    .filter(([key]) => key !== UNASSIGNED)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupItems]) => ({ key: label, label, items: sortByDate(groupItems) }))

  if (map.has(UNASSIGNED)) {
    groups.push({ key: 'unassigned', label: fallbackLabel, items: sortByDate(map.get(UNASSIGNED)) })
  }

  return groups
}
