import { useEffect, useState } from 'react'
import { NotionBlockList } from './NotionBlocks'

// Fetches fresh block content every time it mounts for a given note, rather
// than caching it — Notion's image URLs are pre-signed and expire after
// about an hour, so a cached render would eventually show broken images.
// Shared by the modal preview and the full-page drill-in view.
export default function NoteContent({ note }) {
  const [blocks, setBlocks] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setBlocks(null)
    setError(null)

    fetch(`/api/notion/notes/${note.id}/blocks`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load this note from Notion.')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setBlocks(data.blocks)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this note from Notion.')
      })

    return () => {
      cancelled = true
    }
  }, [note.id])

  if (error) return <p className="dialog-error">{error}</p>
  if (!blocks) return <p className="empty-state">Loading…</p>
  if (blocks.length === 0) return <p className="empty-state">This note is empty.</p>
  return (
    <div className="notion-content">
      <NotionBlockList blocks={blocks} />
    </div>
  )
}
