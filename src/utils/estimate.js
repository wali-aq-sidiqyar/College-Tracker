// Compact board-style duration readout: "~45 min", "~2 hrs", or just "~45"
// when the unit is left N/A.
export function formatEstimate(amount, unit) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (unit === 'n/a') return `~${n}`
  const label = unit === 'hr' ? (n === 1 ? 'hr' : 'hrs') : 'min'
  return `~${n} ${label}`
}
