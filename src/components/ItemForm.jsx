import { useEffect, useState } from 'react'
import { todayISO } from '../utils/date'
import { ITEM_KINDS, ITEM_TYPES } from '../utils/itemTypes'
import TimeEntryInput from './TimeEntryInput'

const emptyForm = {
  kind: 'task',
  type: 'Assignment',
  title: '',
  className: '',
  date: todayISO(),
  startTime: '',
  endTime: '',
  description: '',
  estimateAmount: '',
  estimateUnit: 'min',
}

export default function ItemForm({ editingItem, defaultKind, canCancel, googleConnected, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const isGoogleItem = editingItem?.source === 'google'

  useEffect(() => {
    setForm(editingItem ? { ...emptyForm, ...editingItem } : { ...emptyForm, kind: defaultKind || emptyForm.kind })
    setSaveError(null)
  }, [editingItem, defaultKind])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleKindChange(kind) {
    setForm((prev) => ({
      ...prev,
      kind,
      startTime: kind === 'event' ? prev.startTime : '',
      endTime: kind === 'event' ? prev.endTime : '',
      estimateAmount: kind === 'task' ? prev.estimateAmount : '',
      estimateUnit: kind === 'task' ? prev.estimateUnit : 'min',
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    if (form.kind === 'event' && (!form.startTime || !form.endTime)) return
    // An empty type field means the same thing as explicitly picking N/A.
    const type = form.type.trim() || 'N/A'
    // Events never carry an estimate, even if the item being edited had one
    // saved before this field was removed for events.
    const payload = form.kind === 'event'
      ? { ...form, type, estimateAmount: '', estimateUnit: 'min' }
      : { ...form, type }

    setSaving(true)
    setSaveError(null)
    try {
      await onSave(payload)
      // Only clear the form once the save is actually confirmed — on
      // failure the form (and whatever you typed) stays put so nothing
      // is lost, and you can just retry.
      setForm(emptyForm)
    } catch (err) {
      setSaveError(err.message || 'Could not save this item. Nothing was lost — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="item-form hud-frame" onSubmit={handleSubmit}>
      <h2>{editingItem ? 'Edit item' : 'Add item'}</h2>

      {isGoogleItem && (
        <p className="google-item-banner">
          Editing a Google Calendar event — changes save back to Google.
        </p>
      )}

      <div className="item-form-row">
        <div className="segmented" role="group" aria-label="Kind">
          {ITEM_KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={form.kind === option.value ? 'active' : ''}
              onClick={() => handleKindChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!editingItem && (
        <p className={`google-write-hint${googleConnected ? ' google-write-hint-connected' : ''}`}>
          {googleConnected
            ? 'This will be saved to Google Calendar.'
            : 'Google Calendar isn’t connected — this will be saved locally.'}
        </p>
      )}

      <div className="item-form-row">
        <label>
          Type
          <input
            type="text"
            list="item-type-options"
            placeholder="e.g. Assignment, or type your own"
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
          />
          <datalist id="item-type-options">
            {ITEM_TYPES.map((option) => (
              <option key={option.value} value={option.label} />
            ))}
            <option value="N/A" />
          </datalist>
        </label>

        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
        </label>
      </div>

      {form.kind === 'event' && (
        <div className="item-form-row">
          <label>
            Start time
            <TimeEntryInput
              value={form.startTime}
              onChange={(value) => handleChange('startTime', value)}
              required
            />
          </label>

          <label>
            End time
            <TimeEntryInput
              value={form.endTime}
              onChange={(value) => handleChange('endTime', value)}
              required
            />
          </label>
        </div>
      )}

      <div className="item-form-row">
        <label>
          Title
          <input
            type="text"
            placeholder="e.g. Problem Set 3"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
        </label>

        <label>
          Class
          <input
            type="text"
            placeholder="e.g. CS 101"
            value={form.className}
            onChange={(e) => handleChange('className', e.target.value)}
          />
        </label>
      </div>

      <div className="item-form-row">
        <label>
          Description
          <textarea
            placeholder="Notes, what's covered, submission details…"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </label>
      </div>

      {form.kind === 'task' && (
        <div className="item-form-row">
          <label>
            Estimated time
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 45"
              value={form.estimateAmount}
              onChange={(e) => handleChange('estimateAmount', e.target.value)}
            />
          </label>

          <label>
            Unit
            <select
              value={form.estimateUnit}
              onChange={(e) => handleChange('estimateUnit', e.target.value)}
            >
              <option value="min">Minutes</option>
              <option value="hr">Hours</option>
              <option value="n/a">N/A</option>
            </select>
          </label>
        </div>
      )}

      {saveError && <p className="form-error">{saveError}</p>}

      <div className="item-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : editingItem ? 'Save changes' : 'Add item'}
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
