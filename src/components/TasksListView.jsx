import { useState } from 'react'
import { formatDateDisplay, sortByDate } from '../utils/date'
import { groupTasksByClass, groupTasksByType } from '../utils/taskGrouping'
import { useBulkSelectDelete } from '../hooks/useBulkSelectDelete'
import ItemRow from './ItemRow'
import ConfirmDialog from './ConfirmDialog'

const GROUP_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'class', label: 'Class' },
  { value: 'type', label: 'Type' },
]

export default function TasksListView({ items, onEdit, onDelete, onAddRequest, onToggleComplete }) {
  const [groupBy, setGroupBy] = useState('date')
  const [showCompleted, setShowCompleted] = useState(false)
  const [completingIds, setCompletingIds] = useState(() => new Set())
  const [completeError, setCompleteError] = useState(null)

  const activeTasks = items.filter((item) => !item.completed)
  const completedTasks = items.filter((item) => item.completed)
  const visibleTasks = showCompleted ? [...activeTasks, ...completedTasks] : activeTasks

  const bulk = useBulkSelectDelete(visibleTasks, onDelete)
  const pendingItem = visibleTasks.find((item) => item.id === bulk.pendingDeleteId)

  async function handleToggleComplete(id) {
    setCompleteError(null)
    setCompletingIds((prev) => new Set(prev).add(id))
    try {
      await onToggleComplete(id)
    } catch (err) {
      // The checkbox itself reverts on its own — nothing was optimistically
      // flipped in local state, so failing here just means it never changed.
      setCompleteError(err.message || 'Could not update this task. Try again.')
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <button type="button" onClick={() => onAddRequest('task')}>
          Add task
        </button>

        <div className="segmented" role="group" aria-label="Group tasks by">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={groupBy === option.value ? 'active' : ''}
              onClick={() => setGroupBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {completedTasks.length > 0 && (
          <label className="list-show-completed">
            <input
              type="checkbox"
              className="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show completed ({completedTasks.length})
          </label>
        )}
      </div>

      {completeError && <p className="form-error">{completeError}</p>}

      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Add one above.</p>
      ) : (
        <>
          {visibleTasks.length > 0 && (
            <div className="list-bulk-bar">
              <label className="list-bulk-select-all">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={bulk.allSelected}
                  onChange={bulk.toggleSelectAll}
                  disabled={bulk.deleting || bulk.bulkPending}
                />
                Select all
              </label>
              <span className="list-bulk-count">{bulk.selectedCount} selected</span>
              <button
                type="button"
                className="danger-solid"
                disabled={bulk.selectedCount === 0 || bulk.deleting || bulk.bulkPending}
                onClick={bulk.openBulkDelete}
              >
                Delete selected
              </button>
            </div>
          )}

          {activeTasks.length === 0 ? (
            <p className="empty-state">Nothing active — nice work.</p>
          ) : (
            <TaskGroupList
              tasks={activeTasks}
              groupBy={groupBy}
              bulk={bulk}
              onEdit={onEdit}
              onToggleComplete={handleToggleComplete}
              completingIds={completingIds}
            />
          )}

          {showCompleted && completedTasks.length > 0 && (
            <section className="event-section">
              <h3 className="event-section-heading">Completed</h3>
              <TaskGroupList
                tasks={completedTasks}
                groupBy={groupBy}
                bulk={bulk}
                onEdit={onEdit}
                onToggleComplete={handleToggleComplete}
                completingIds={completingIds}
              />
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingItem != null}
        title={`Delete “${pendingItem?.title}”?`}
        description="This can't be undone."
        pending={bulk.deleting}
        error={bulk.deleteError}
        onConfirm={bulk.confirmDelete}
        onCancel={bulk.cancelDelete}
      />

      {bulk.bulkSnapshot && (
        <ConfirmDialog
          open={bulk.bulkOpen}
          wide
          title={
            bulk.bulkResult
              ? 'Bulk delete stopped'
              : `Delete ${bulk.bulkSnapshot.items.length} task${bulk.bulkSnapshot.items.length === 1 ? '' : 's'}?`
          }
          description={
            bulk.bulkResult
              ? null
              : bulk.bulkSnapshot.googleCount === 0
                ? "This can't be undone."
                : bulk.bulkSnapshot.localCount === 0
                  ? `This can't be undone. All ${bulk.bulkSnapshot.googleCount} will also be removed from Google Calendar.`
                  : `This can't be undone. ${bulk.bulkSnapshot.googleCount} of these ${bulk.bulkSnapshot.items.length} will also be removed from Google Calendar — the rest are local-only.`
          }
          confirmLabel="Delete"
          cancelLabel={bulk.bulkResult ? 'Close' : 'Cancel'}
          pending={bulk.bulkPending}
          hideConfirm={Boolean(bulk.bulkResult)}
          onConfirm={bulk.confirmBulkDelete}
          onCancel={bulk.closeBulkDialog}
        >
          {bulk.bulkResult ? (
            <div className="dialog-bulk-report">
              {bulk.bulkResult.succeededTitles.length > 0 && (
                <p className="dialog-bulk-line">
                  Deleted ({bulk.bulkResult.succeededTitles.length}): {bulk.bulkResult.succeededTitles.join(', ')}
                </p>
              )}
              <p className="dialog-error">
                Stopped — couldn&rsquo;t delete &ldquo;{bulk.bulkResult.failedTitle}&rdquo;: {bulk.bulkResult.message}
              </p>
              {bulk.bulkResult.notAttemptedTitles.length > 0 && (
                <p className="dialog-bulk-line">
                  Not attempted ({bulk.bulkResult.notAttemptedTitles.length}): {bulk.bulkResult.notAttemptedTitles.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <ul className="dialog-item-list">
              {bulk.bulkSnapshot.items.map((item) => (
                <li key={item.id}>
                  <span className="dialog-item-title">{item.title}</span>
                  <span className="dialog-item-meta">
                    {formatDateDisplay(item.date)}
                    {item.source === 'google' && ' · Google'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}

// Renders a task list either flat-by-date (today's default behavior,
// unchanged) or bucketed into labeled sections by class/type. Used for both
// the active area and the Completed area, which is what makes "Completed
// respects the active grouping" automatic rather than a separate feature.
function TaskGroupList({ tasks, groupBy, bulk, onEdit, onToggleComplete, completingIds }) {
  if (groupBy === 'date') {
    return (
      <ul className="item-list">
        {sortByDate(tasks).map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            selected={bulk.selectedIds.has(item.id)}
            onToggleSelect={bulk.toggleSelect}
            onEdit={onEdit}
            onRequestDelete={bulk.requestDelete}
            disabled={bulk.bulkPending}
            completed={item.completed}
            onToggleComplete={onToggleComplete}
            completing={completingIds.has(item.id)}
          />
        ))}
      </ul>
    )
  }

  const groups = groupBy === 'class' ? groupTasksByClass(tasks) : groupTasksByType(tasks)

  return groups.map((group) => (
    <section key={group.key} className="event-section">
      <h3 className="event-section-heading">{group.label}</h3>
      <ul className="item-list">
        {group.items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            selected={bulk.selectedIds.has(item.id)}
            onToggleSelect={bulk.toggleSelect}
            onEdit={onEdit}
            onRequestDelete={bulk.requestDelete}
            disabled={bulk.bulkPending}
            completed={item.completed}
            onToggleComplete={onToggleComplete}
            completing={completingIds.has(item.id)}
          />
        ))}
      </ul>
    </section>
  ))
}
