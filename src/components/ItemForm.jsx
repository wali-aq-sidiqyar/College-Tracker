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

export default function ItemForm({ editingItem, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(editingItem ? { ...emptyForm, ...editingItem } : emptyForm)
  }, [editingItem])

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

  function handleSubmit(e) {
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
    onSave(payload)
    setForm(emptyForm)
  }

  return (
    <form className="item-form hud-frame" onSubmit={handleSubmit}>
      <h2>{editingItem ? 'Edit item' : 'Add item'}</h2>

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

      <div className="item-form-actions">
        <button type="submit">{editingItem ? 'Save changes' : 'Add item'}</button>
        {editingItem && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
