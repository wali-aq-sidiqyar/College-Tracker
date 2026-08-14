import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  pending = false,
  error = null,
  hideConfirm = false,
  wide = false,
  children,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement
    cancelRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !pending) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [open, onCancel, pending])

  if (!open) return null

  return createPortal(
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel()
      }}
    >
      <div
        className={`dialog-card hud-frame${wide ? ' dialog-card-wide' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <h2 id={titleId}>{title}</h2>
        {description && (
          <p id={descriptionId} className="dialog-description">
            {description}
          </p>
        )}
        {children}
        {error && <p className="dialog-error">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="secondary" ref={cancelRef} onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          {!hideConfirm && (
            <button type="button" className="danger-solid" onClick={onConfirm} disabled={pending}>
              {pending ? 'Deleting…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
