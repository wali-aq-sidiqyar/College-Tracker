// Compact board-style duration readout: "~45 min", "~2 hrs".
export function formatEstimate(amount, unit) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return ''
  const label = unit === 'hr' ? (n === 1 ? 'hr' : 'hrs') : 'min'
  return `~${n} ${label}`
}
