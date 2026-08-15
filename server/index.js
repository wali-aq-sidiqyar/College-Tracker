import 'dotenv/config'
import express from 'express'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import notionRoutes from './routes/notion.js'

const REQUIRED_ENV = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.warn(
    `[google-calendar] Missing ${missing.join(', ')} in .env — connecting will fail until these are set. See .env.example.`
  )
}

const NOTION_ENV = ['NOTION_API_KEY', 'NOTION_DATABASE_ID']
const missingNotion = NOTION_ENV.filter((key) => !process.env[key])
if (missingNotion.length > 0) {
  console.warn(
    `[notion] Missing ${missingNotion.join(', ')} in .env — Notes will show a setup message until these are set. See .env.example.`
  )
}

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/notion', notionRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Google Calendar backend listening on http://localhost:${PORT}`)
})
