import { Router } from 'express'
import { google } from 'googleapis'
import { getAuthorizedClient, isConnected } from '../googleAuth.js'

const router = Router()

router.use((req, res, next) => {
  if (!isConnected()) {
    res.status(401).json({ error: 'not_connected' })
    return
  }
  next()
})

function calendarClient() {
  return google.calendar({ version: 'v3', auth: getAuthorizedClient() })
}

// A rolling window around "now" — recent past through next couple of
// semesters — instead of every event a Google account has ever had.
function defaultTimeRange() {
  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString()
  return { timeMin, timeMax }
}

router.get('/', async (req, res) => {
  try {
    const { timeMin, timeMax } = defaultTimeRange()
    const { data } = await calendarClient().events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })
    res.json({ items: data.items || [] })
  } catch (err) {
    console.error('Google events.list failed:', err.message)
    res.status(502).json({ error: 'google_api_error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { data } = await calendarClient().events.insert({
      calendarId: 'primary',
      requestBody: req.body,
    })
    res.status(201).json(data)
  } catch (err) {
    console.error('Google events.insert failed:', err.message)
    res.status(502).json({ error: 'google_api_error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { data } = await calendarClient().events.patch({
      calendarId: 'primary',
      eventId: req.params.id,
      requestBody: req.body,
    })
    res.json(data)
  } catch (err) {
    console.error('Google events.patch failed:', err.message)
    res.status(502).json({ error: 'google_api_error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await calendarClient().events.delete({
      calendarId: 'primary',
      eventId: req.params.id,
    })
    res.status(204).end()
  } catch (err) {
    console.error('Google events.delete failed:', err.message)
    res.status(502).json({ error: 'google_api_error' })
  }
})

export default router
