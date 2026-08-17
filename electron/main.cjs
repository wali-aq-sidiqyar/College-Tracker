// Electron main process. Deliberately .cjs: package.json has
// "type": "module" for the Vite/React frontend and server, but
// Electron's main-process entry is simplest as CommonJS — this sidesteps
// any ESM-loader friction rather than fighting it.
//
// Job of this file: start the existing Express server (server/index.js,
// completely unmodified — it doesn't know or care that it's running
// under Electron), wait for it to actually be listening, then open a
// window pointed at it. The frontend already talks to the backend over
// plain relative fetch() calls, so there's no IPC/preload bridge to
// build — this is process supervision + window chrome, nothing more.
const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')
const { fork } = require('node:child_process')

const isPackaged = app.isPackaged

// Electron's app.getPath('userData') defaults to package.json's "name"
// ("college-tracker"), not the "College Tracker" shown in the Dock/menu
// bar (that's productName, an electron-builder/Info.plist concern) —
// without this they'd silently diverge and token storage would end up
// in a folder that doesn't match the app's visible name anywhere else.
app.setName('College Tracker')

// server/ sits alongside this file whether that's inside app.asar
// (packaged) or the plain project tree (dev) — Electron's fork()
// transparently reads scripts from inside an asar archive, so no
// separate packaged-path branch is needed here.
const serverEntry = path.join(__dirname, '..', 'server', 'index.js')

// .env isn't part of the normal source tree — electron-builder copies
// it into Contents/Resources/.env via extraResources (Phase 4), which
// is process.resourcesPath directly, not the app/ subfolder server.js
// lives in. In dev, that's just the project root.
const dotenvPath = isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '..', '.env')
require('dotenv').config({ path: dotenvPath })

const PORT = process.env.PORT || 3001
const BASE_URL = `http://localhost:${PORT}`

let serverProcess = null
let mainWindow = null

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = fork(serverEntry, [], {
      env: {
        ...process.env,
        PORT: String(PORT),
        // The packaged app bundle is read-only; tokens have to live
        // somewhere writable. See server/googleAuth.js — this is
        // exactly the override Phase 2 added.
        TOKENS_PATH: path.join(app.getPath('userData'), 'tokens.json'),
        // .env's FRONTEND_URL (localhost:5173) is correct for `npm run
        // dev:all`'s separate Vite dev server, but frontend and backend
        // share one origin here (Phase 1) — the OAuth callback route
        // redirects the browser to FRONTEND_URL after a successful
        // exchange, so leaving the dev value in place sends a
        // successful connection to a dead port in the packaged app.
        FRONTEND_URL: BASE_URL,
      },
      stdio: 'pipe',
    })

    serverProcess.stdout.on('data', (data) => process.stdout.write(`[server] ${data}`))
    serverProcess.stderr.on('data', (data) => process.stderr.write(`[server] ${data}`))
    serverProcess.on('error', reject)
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) console.error(`[electron] server process exited with code ${code}`)
    })

    waitForServer(resolve, reject)
  })
}

function waitForServer(resolve, reject, attempt = 0) {
  const MAX_ATTEMPTS = 60 // ~15s at 250ms
  fetch(BASE_URL)
    .then(() => resolve())
    .catch(() => {
      if (attempt >= MAX_ATTEMPTS) {
        reject(new Error('Backend server did not start in time'))
        return
      }
      setTimeout(() => waitForServer(resolve, reject, attempt + 1), 250)
    })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'College Tracker',
    backgroundColor: '#05040b',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(BASE_URL)

  // Google refuses to show its OAuth consent screen inside an embedded
  // webview like an Electron BrowserWindow ("disallowed_useragent") —
  // this is a hard policy block, not a quirk to work around locally.
  // The fix is to hand that one navigation off to the system browser;
  // the callback that follows (localhost, not google.com) is unaffected
  // and completes the flow normally. We just poll /auth/status
  // afterward and reload the window once it flips to connected, since
  // the callback response lands in the system browser, not back here.
  //
  // The tricky part: our own /auth/google route reaches Google via an
  // HTTP 302, and Electron does NOT fire `will-navigate` for
  // redirect-driven navigations — only `will-redirect`. Listening to
  // `will-navigate` alone let that first hop load Google's sign-in page
  // directly inside the embedded window every time, which is worse
  // than just ugly: proceeding from inside the embedded session (before
  // Google's later same-page bounce got caught) handed the system
  // browser a degraded/interstitial URL instead of the original
  // well-formed OAuth request, which is what actually produced the 504
  // — not a real backend problem. Handling both events, plus a
  // window-open interceptor in case Google ever uses a popup instead of
  // a same-window redirect, catches it at the very first hop so the
  // embedded window never renders any Google content at all.
  const interceptGoogleAuth = (event, url) => {
    if (!url.startsWith('https://accounts.google.com')) return
    event.preventDefault()
    shell.openExternal(url)
    pollForConnection()
  }
  mainWindow.webContents.on('will-navigate', interceptGoogleAuth)
  mainWindow.webContents.on('will-redirect', interceptGoogleAuth)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com')) {
      shell.openExternal(url)
      pollForConnection()
    }
    return { action: 'deny' }
  })
}

function pollForConnection(attempt = 0) {
  const MAX_ATTEMPTS = 120 // ~3 minutes at 1.5s
  if (attempt >= MAX_ATTEMPTS) return
  fetch(`${BASE_URL}/auth/status`)
    .then((res) => res.json())
    .then(({ connected }) => {
      if (connected) {
        mainWindow?.loadURL(BASE_URL)
      } else {
        setTimeout(() => pollForConnection(attempt + 1), 1500)
      }
    })
    .catch(() => setTimeout(() => pollForConnection(attempt + 1), 1500))
}

app.whenReady().then(async () => {
  try {
    await startServer()
  } catch (err) {
    console.error('[electron] failed to start backend server:', err)
    app.quit()
    return
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  serverProcess?.kill()
})
