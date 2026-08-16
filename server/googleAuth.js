import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// In the packaged Electron app this points at a writable user-data
// directory (set by electron/main.cjs when it forks this server) —
// server/ itself lives inside the read-only app bundle there. Dev and
// the plain `node server/index.js` workflow fall back to the current
// behavior: right next to this file.
const TOKENS_PATH = process.env.TOKENS_PATH || path.join(__dirname, 'tokens.json')

// Read/write access to events (not full calendar management) — the
// narrowest scope that still supports create/edit/delete.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

function loadTokens() {
  if (!fs.existsSync(TOKENS_PATH)) return null
  return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'))
}

function saveTokens(tokens) {
  fs.mkdirSync(path.dirname(TOKENS_PATH), { recursive: true })
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2))
}

export function isConnected() {
  return !!loadTokens()?.refresh_token
}

export function getAuthUrl() {
  return createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    // Forces Google to hand back a refresh_token even if this account
    // has authorized the app before (Google only does that on first
    // consent otherwise).
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeCode(code) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  saveTokens(tokens)
  return tokens
}

// Returns an OAuth2Client with stored credentials loaded, wired to persist
// whatever refreshed access token googleapis fetches next time it's used —
// so callers never have to think about refreshing by hand.
export function getAuthorizedClient() {
  const client = createOAuthClient()
  const tokens = loadTokens()
  if (tokens) client.setCredentials(tokens)
  client.on('tokens', (refreshed) => {
    saveTokens({ ...loadTokens(), ...refreshed })
  })
  return client
}

export function disconnect() {
  if (fs.existsSync(TOKENS_PATH)) fs.unlinkSync(TOKENS_PATH)
}
