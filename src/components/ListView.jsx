import { formatDateDisplay, sortByDate } from '../utils/date'
import { formatTimeRange } from '../utils/eventTime'
import { useBulkSelectDelete } from '../hooks/useBulkSelectDelete'
import ItemRow from './ItemRow'
import ConfirmDialog from './ConfirmDialog'

export default function ListView({ items, kind, onEdit, onDelete, onAddRequest }) {
  const sorted = sortByDate(items)
  const kindLabel = kind === 'task' ? 'task' : 'event'
  const bulk = useBulkSelectDelete(sorted, onDelete)
  const pendingItem = sorted.find((item) => item.id === bulk.pendingDeleteId)

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <button type="button" onClick={() => onAddRequest(kind)}>
          Add {kindLabel}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-state">No {kindLabel}s yet. Add one above.</p>
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

          <ul className="item-list">
            {sorted.map((item, index) => (
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
              : `Delete ${bulk.bulkSnapshot.items.length} ${kindLabel}${bulk.bulkSnapshot.items.length === 1 ? '' : 's'}?`
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
                    {item.kind === 'event' && ` · ${formatTimeRange(item.startTime, item.endTime)}`}
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
