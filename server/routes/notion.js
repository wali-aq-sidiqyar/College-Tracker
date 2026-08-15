import { Router } from 'express'
import { createPage, fetchBlockTree, getDatabaseSchema, isConfigured, notionFetch, queryDatabaseAll } from '../notionClient.js'

const router = Router()

router.use((req, res, next) => {
  if (!isConfigured()) {
    res.status(401).json({ error: 'not_configured' })
    return
  }
  next()
})

// Notion property values arrive shaped by their property type — this reads
// whichever type Title/Class/Date/Semester/Year actually are, rather than
// assuming one.
function extractPropertyValue(prop) {
  if (!prop) return ''
  switch (prop.type) {
    case 'title':
      return (prop.title || []).map((t) => t.plain_text).join('')
    case 'rich_text':
      return (prop.rich_text || []).map((t) => t.plain_text).join('')
    case 'select':
      return prop.select?.name || ''
    case 'multi_select':
      return (prop.multi_select || []).map((s) => s.name).join(', ')
    case 'number':
      return prop.number != null ? String(prop.number) : ''
    case 'date':
      return prop.date?.start ? prop.date.start.slice(0, 10) : ''
    default:
      return ''
  }
}

router.get('/notes', async (req, res) => {
  try {
    const pages = await queryDatabaseAll(process.env.NOTION_DATABASE_ID)
    const notes = pages.map((page) => ({
      id: page.id,
      title: extractPropertyValue(page.properties.Title) || '(Untitled note)',
      className: extractPropertyValue(page.properties.Class),
      date: extractPropertyValue(page.properties.Date),
      semester: extractPropertyValue(page.properties.Semester),
      year: extractPropertyValue(page.properties.Year),
      url: page.url,
    }))
    res.json({ notes })
  } catch (err) {
    console.error('Notion database query failed:', err.message)
    res.status(502).json({ error: 'notion_api_error' })
  }
})

// The inverse of extractPropertyValue — builds a property value in whatever
// shape the database's actual schema expects, so Class/Semester/Year write
// correctly regardless of which property type they turn out to be.
function buildPropertyValue(type, value) {
  switch (type) {
    case 'select':
      return { select: { name: value } }
    case 'multi_select':
      return { multi_select: [{ name: value }] }
    case 'number': {
      const num = Number(value)
      return { number: Number.isNaN(num) ? null : num }
    }
    case 'rich_text':
    default:
      return { rich_text: [{ text: { content: value } }] }
  }
}

router.post('/notes', async (req, res) => {
  const { title, date, className, semester, year } = req.body || {}
  if (!title?.trim() || !date) {
    res.status(400).json({ error: 'invalid_request' })
    return
  }

  try {
    const databaseId = process.env.NOTION_DATABASE_ID
    const schema = await getDatabaseSchema(databaseId)

    const properties = {
      Title: { title: [{ text: { content: title.trim() } }] },
      Date: { date: { start: date } },
    }
    if (className) properties.Class = buildPropertyValue(schema.properties.Class?.type, className)
    if (semester) properties.Semester = buildPropertyValue(schema.properties.Semester?.type, semester)
    if (year) properties.Year = buildPropertyValue(schema.properties.Year?.type, year)

    const page = await createPage(databaseId, properties)
    res.status(201).json({ id: page.id, url: page.url })
  } catch (err) {
    console.error('Notion page create failed:', err.message)
    res.status(502).json({ error: 'notion_api_error' })
  }
})

// Archives (not permanently deletes) — the page moves to Notion's trash and
// is recoverable there, same as manually trashing it in Notion's own UI.
router.delete('/notes/:pageId', async (req, res) => {
  try {
    await notionFetch(`/pages/${req.params.pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: true }),
    })
    res.status(204).end()
  } catch (err) {
    console.error('Notion page archive failed:', err.message)
    res.status(502).json({ error: 'notion_api_error' })
  }
})

router.get('/notes/:pageId/blocks', async (req, res) => {
  try {
    const blocks = await fetchBlockTree(req.params.pageId)
    res.json({ blocks })
  } catch (err) {
    console.error('Notion block fetch failed:', err.message)
    res.status(502).json({ error: 'notion_api_error' })
  }
})

export default router
