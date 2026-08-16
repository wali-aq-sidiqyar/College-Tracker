import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import notionRoutes from './routes/notion.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')

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

// Serves the built frontend (npm run build) so the whole app — UI and
// API — runs on this one origin, which is what the Electron shell will
// point its window at. express.static already serves index.html for
// `/`; no SPA catch-all route is needed since the app has no
// client-side routing (tabs are React state, not URL paths) — and
// Express 5's stricter route-pattern syntax makes a naive `app.get('*')`
// catch-all more trouble than it's worth for a route this app doesn't
// need anyway. In dev, Vite serves the frontend instead and this
// directory won't exist yet, so the fallback is just a 404 — fine,
// since dev mode never hits this server for the frontend.
app.use(express.static(distPath))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Google Calendar backend listening on http://localhost:${PORT}`)
})
