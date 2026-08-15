import { useEffect, useState } from 'react'
import TimeEntryInput from './TimeEntryInput'

const emptyForm = { text: '', date: '', time: '' }

// Deliberately minimal — a reminder is just text plus an optional
// date/time, so unlike ItemForm there's no kind/type/class/estimate.
export default function ReminderForm({ editingReminder, canCancel, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setForm(
      editingReminder
        ? { text: editingReminder.text, date: editingReminder.date || '', time: editingReminder.time || '' }
        : emptyForm
    )
    setSaveError(null)
  }, [editingReminder])

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // A time with no date doesn't mean anything on its own.
      if (field === 'date' && !value) next.time = ''
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.text.trim()) return

    setSaving(true)
    setSaveError(null)
    try {
      await onSave({ text: form.text.trim(), date: form.date, time: form.date ? form.time : '' })
      setForm(emptyForm)
    } catch (err) {
      setSaveError(err.message || 'Could not save this reminder. Nothing was lost — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="item-form hud-frame" onSubmit={handleSubmit}>
      <h2>{editingReminder ? 'Edit reminder' : 'Add reminder'}</h2>

      <div className="item-form-row">
        <label>
          Reminder
          <input
            type="text"
            placeholder="e.g. Email professor about extension"
            value={form.text}
            onChange={(e) => handleChange('text', e.target.value)}
            autoFocus
            required
          />
        </label>
      </div>

      <div className="item-form-row">
        <label>
          Date (optional)
          <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} />
        </label>

        <label>
          Time (optional)
          <TimeEntryInput
            value={form.time}
            onChange={(value) => handleChange('time', value)}
            disabled={!form.date}
          />
        </label>
      </div>

      {saveError && <p className="form-error">{saveError}</p>}

      <div className="item-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : editingReminder ? 'Save changes' : 'Add reminder'}
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
