import { Router } from 'express'
import { fetchBlockTree, isConfigured, queryDatabaseAll } from '../notionClient.js'

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
