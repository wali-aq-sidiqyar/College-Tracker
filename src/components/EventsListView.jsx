import { useState } from 'react'
import { formatDateDisplay } from '../utils/date'
import { formatTimeRange } from '../utils/eventTime'
import { typeSlug } from '../utils/itemTypes'
import { groupRecurringEvents } from '../utils/recurringEvents'
import { useBulkSelectDelete } from '../hooks/useBulkSelectDelete'
import ItemRow from './ItemRow'
import ConfirmDialog from './ConfirmDialog'

export default function EventsListView({ items, onEdit, onDelete, onAddRequest }) {
  const [expandedSeries, setExpandedSeries] = useState(() => new Set())

  const { oneTime, recurringGroups } = groupRecurringEvents(items)
  const expandedOccurrences = recurringGroups
    .filter((group) => expandedSeries.has(group.recurringEventId))
    .flatMap((group) => group.occurrences)

  // Selection only ever covers individually-rendered rows — one-time
  // events plus whatever recurring occurrences are currently expanded. A
  // collapsed group has no checkbox of its own, so it can never be
  // bulk-selected as a whole series.
  const selectableItems = [...oneTime, ...expandedOccurrences]
  const bulk = useBulkSelectDelete(selectableItems, onDelete)
  const pendingItem = items.find((item) => item.id === bulk.pendingDeleteId)

  function toggleExpanded(recurringEventId) {
    setExpandedSeries((prev) => {
      const next = new Set(prev)
      if (next.has(recurringEventId)) next.delete(recurringEventId)
      else next.add(recurringEventId)
      return next
    })
  }

  const hasAnything = oneTime.length > 0 || recurringGroups.length > 0

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <button type="button" onClick={() => onAddRequest('event')}>
          Add event
        </button>
      </div>

      {!hasAnything ? (
        <p className="empty-state">No events yet. Add one above.</p>
      ) : (
        <>
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

          {oneTime.length > 0 && (
            <section className="event-section">
              <h3 className="event-section-heading">One-time</h3>
              <ul className="item-list">
                {oneTime.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    selected={bulk.selectedIds.has(item.id)}
                    onToggleSelect={bulk.toggleSelect}
                    onEdit={onEdit}
                    onRequestDelete={bulk.requestDelete}
                    disabled={bulk.bulkPending}
                  />
                ))}
              </ul>
            </section>
          )}

          {recurringGroups.length > 0 && (
            <section className="event-section">
              <h3 className="event-section-heading">Recurring</h3>
              <ul className="item-list">
                {recurringGroups.map((group) => {
                  const isExpanded = expandedSeries.has(group.recurringEventId)
                  const representative = group.occurrences[0]
                  const slug = typeSlug(representative.type)
                  return (
                    <li key={group.recurringEventId} className="recurring-group">
                      <div className={`item-row item-row-${slug} recurring-group-row`}>
                        <div className="item-row-select" aria-hidden="true" />
                        <div className="item-row-content">
                          <div className="item-row-main">
                            <span className={`item-badge item-badge-${slug}`}>{representative.type}</span>
                            <span className="item-title">{representative.title}</span>
                            {representative.className && (
                              <span className="item-class">{representative.className}</span>
                            )}
                          </div>
                          {representative.description && (
                            <p className="item-description">{representative.description}</p>
                          )}
                        </div>
                        <div className="item-row-actions">
                          <span className="item-recurrence-pattern">{group.pattern}</span>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => toggleExpanded(group.recurringEventId)}
                          >
                            {isExpanded ? 'Hide occurrences' : `View occurrences (${group.occurrences.length})`}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <ul className="item-list recurring-occurrences">
                          {group.occurrences.map((item, index) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              index={index}
                              selected={bulk.selectedIds.has(item.id)}
                              onToggleSelect={bulk.toggleSelect}
                              onEdit={onEdit}
                              onRequestDelete={bulk.requestDelete}
                              disabled={bulk.bulkPending}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingItem != null}
        title={`Delete “${pendingItem?.title}”?`}
        description={
          pendingItem?.recurringEventId
            ? "This can't be undone. This deletes only this one occurrence — the rest of the series is unaffected."
            : "This can't be undone."
        }
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
              : `Delete ${bulk.bulkSnapshot.items.length} event${bulk.bulkSnapshot.items.length === 1 ? '' : 's'}?`
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
                    {formatDateDisplay(item.date)} · {formatTimeRange(item.startTime, item.endTime)}
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
