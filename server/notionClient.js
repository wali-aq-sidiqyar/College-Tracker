const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export function isConfigured() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID)
}

// Thin fetch wrapper — throws on failure rather than swallowing errors, same
// reliability pattern as the Google integration, so a bad token or a
// misspelled database ID surfaces clearly instead of silently returning
// nothing.
export async function notionFetch(path, options = {}) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.message || res.statusText
    throw new Error(`Notion API ${res.status}: ${message}`)
  }
  return res.json()
}

export async function getDatabaseSchema(databaseId) {
  return notionFetch(`/databases/${databaseId}`)
}

export async function createPage(databaseId, properties) {
  return notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  })
}

export async function queryDatabaseAll(databaseId) {
  const results = []
  let cursor
  do {
    const body = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
    })
    results.push(...body.results)
    cursor = body.has_more ? body.next_cursor : undefined
  } while (cursor)
  return results
}

// Recursively fetches a block's children, attaching nested children to any
// block that has them (lists, toggles, quotes, callouts can all nest).
// child_page/child_database are left un-recursed — rendering someone else's
// whole page inside this preview is out of scope.
export async function fetchBlockTree(blockId) {
  const children = []
  let cursor
  do {
    const body = await notionFetch(
      `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`
    )
    children.push(...body.results)
    cursor = body.has_more ? body.next_cursor : undefined
  } while (cursor)

  const withChildren = await Promise.all(
    children.map(async (block) => {
      if (!block.has_children || block.type === 'child_page' || block.type === 'child_database') {
        return block
      }
      return { ...block, children: await fetchBlockTree(block.id) }
    })
  )
  return withChildren
}
