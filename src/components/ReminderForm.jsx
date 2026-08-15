import { useState } from 'react'

// Deliberately minimal — a reminder is just text, so unlike ItemForm there's
// no kind/type/class/date/estimate to ask for.
export default function ReminderForm({ canCancel, onSave, onCancel }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    setSaving(true)
    setSaveError(null)
    try {
      await onSave(text.trim())
      setText('')
    } catch (err) {
      setSaveError(err.message || 'Could not save this reminder. Nothing was lost — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="item-form hud-frame" onSubmit={handleSubmit}>
      <h2>Add reminder</h2>

      <div className="item-form-row">
        <label>
          Reminder
          <input
            type="text"
            placeholder="e.g. Email professor about extension"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            required
          />
        </label>
      </div>

      {saveError && <p className="form-error">{saveError}</p>}

      <div className="item-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add reminder'}
        </button>
        {canCancel && (
          <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
