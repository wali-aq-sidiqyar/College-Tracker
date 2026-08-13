import { useEffect, useRef, useState } from 'react'
import { formatTypedDigitsDisplay, parseTypedTime, splitTypedTime } from '../utils/eventTime'

// Types a 4-digit clock time (e.g. "0230") plus an AM/PM dropdown, and
// reports the parsed 24-hour "HH:MM" string the rest of the app uses.
export default function TimeEntryInput({ value, onChange, required }) {
  const [digits, setDigits] = useState(() => splitTypedTime(value).digits)
  const [period, setPeriod] = useState(() => splitTypedTime(value).period)
  const [focused, setFocused] = useState(false)
  const lastEmitted = useRef(value)

  // Only resync from `value` when it changed for a reason other than our
  // own typing (e.g. switching to a different item, or the form resetting
  // after submit) — otherwise every keystroke would echo back and stomp
  // whatever's mid-typing.
  useEffect(() => {
    if (value === lastEmitted.current) return
    const split = splitTypedTime(value)
    setDigits(split.digits)
    setPeriod(split.period)
    lastEmitted.current = value
  }, [value])

  function commit(nextDigits, nextPeriod) {
    const parsed = parseTypedTime(nextDigits, nextPeriod) ?? ''
    lastEmitted.current = parsed
    onChange(parsed)
  }

  function handleDigitsChange(e) {
    const nextDigits = e.target.value.replace(/\D/g, '').slice(0, 4)
    setDigits(nextDigits)
    commit(nextDigits, period)
  }

  function handlePeriodChange(e) {
    const nextPeriod = e.target.value
    setPeriod(nextPeriod)
    commit(digits, nextPeriod)
  }

  function handleFocus() {
    setFocused(true)
  }

  // Snap the digits to the full, normalized form once the field is
  // complete, e.g. "3" -> "0300", "330" -> "0330" — the colon then shows
  // up via the display formatting below since the field is no longer focused.
  function handleBlur() {
    setFocused(false)
    const parsed = parseTypedTime(digits, period)
    if (!parsed) return
    setDigits(splitTypedTime(parsed).digits)
  }

  const displayValue = focused ? digits : formatTypedDigitsDisplay(digits)

  return (
    <div className="time-entry">
      <input
        type="text"
        inputMode="numeric"
        placeholder="0230"
        maxLength={4}
        value={displayValue}
        onChange={handleDigitsChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="time-entry-digits"
        required={required}
      />
      <select value={period} onChange={handlePeriodChange} className="time-entry-period">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
