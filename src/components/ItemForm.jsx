import { useEffect, useState } from 'react'
import { todayISO } from '../utils/date'

const emptyForm = { type: 'assignment', title: '', className: '', date: todayISO() }

export default function ItemForm({ editingItem, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(editingItem ? { ...editingItem } : emptyForm)
  }, [editingItem])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSave(form)
    setForm(emptyForm)
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{editingItem ? 'Edit item' : 'Add assignment or exam'}</h2>

      <div className="item-form-row">
        <label>
          Type
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
          </select>
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
