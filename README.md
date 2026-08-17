# College Tracker

A personal college organizer: a Calendar, Tasks, Events, and Reminders board backed by a React/Vite frontend and an Express backend, with two-way Google Calendar sync and read/create/delete access to a Notion class-notes database. Ships as a normal web app for development and as a standalone Mac desktop app for daily use.

## Features

- **Calendar** — month/week/day views combining your local tasks/events with your real Google Calendar.
- **Tasks & Events** — create, edit, complete, and delete, with class, type (assignment/exam/quiz/paper/project/homework), and estimated time.
- **Google Calendar sync** — two-way: items created here can write to Google Calendar, and Google Calendar events show up here, once you connect your own account.
- **Notes** — browse, open, and create notes in a Notion database (organized by class), and delete (archives to Notion's trash, recoverable there).
- **Reminders** — simple due-date/time reminders, sorted and grouped, with overdue flagging.
- **Two switchable themes** — "Night City" (dark, neon) and "Spring" (light, soft, cherry-blossom), each with its own matching background photo you can toggle on or off independently. Your choice persists.
- **Mac desktop app** — the same app, packaged with Electron, launchable from a Dock icon with no terminal required.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later (includes npm).
- A Google account, to create your own Google Cloud OAuth credentials (free).
- A Notion account, to create your own internal integration and a notes database (free).

You need your **own** Google and Notion credentials — this repo does not include any. Nothing works until you complete the setup below.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your own Google Cloud OAuth credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or use an existing one).
2. **APIs & Services → Library** — find **Google Calendar API** and enable it.
3. **APIs & Services → OAuth consent screen** — set it up (External is fine for personal use). Since the app won't be Google-verified, it starts in "Testing" mode, which only allows sign-in from accounts you explicitly add — add your own Google account under **Test users**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID.**
   - Application type: **Web application** (not "Desktop app" — that type doesn't support the fixed redirect URI this app registers).
   - Under **Authorized redirect URIs**, add exactly:
     ```
     http://localhost:3001/auth/google/callback
     ```
   - Save, then copy the generated **Client ID** and **Client secret**.

### 3. Create your own Notion integration and database

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create a new **internal** integration. Copy its secret (starts with `ntn_` or `secret_`).
2. Create (or pick an existing) Notion database for your class notes, with these properties:
   | Property   | Type                                    |
   |------------|------------------------------------------|
   | `Title`    | Title (Notion's default title property)  |
   | `Class`    | any of: select, rich text, or number      |
   | `Date`     | Date                                      |
   | `Semester` | any of: select, rich text, or number      |
   | `Year`     | any of: select, rich text, or number      |

   Property names must match exactly (case-sensitive). `Class`/`Semester`/`Year` adapt to whichever type you use; `Title` and `Date` must be their respective Notion types.
3. Open the database in Notion, click the **`...`** menu → **Connections** → add your integration. Without this step, the API key can't see the database at all.
4. Copy the database ID out of its URL: `notion.so/<workspace>/<DATABASE_ID>?v=...` — a 32-character ID, dashes optional.

### 4. Configure environment variables

Copy the example file and fill in the values you just collected:

```bash
cp .env.example .env
```

| Variable | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client, step 2 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client, step 2 |
| `GOOGLE_REDIRECT_URI` | Leave as `http://localhost:3001/auth/google/callback` — must exactly match what you registered |
| `PORT` | Leave as `3001` unless it's already in use on your machine (see note below) |
| `FRONTEND_URL` | Leave as `http://localhost:5173` for local dev (Vite's default port — see note below) |
| `NOTION_API_KEY` | Notion integration secret, step 3 |
| `NOTION_DATABASE_ID` | Notion database ID, step 3 |

> [!NOTE]
> **5173 is Vite's default, not a guarantee.** If something else on your machine is already using it, Vite silently starts on the next free port instead (5174, 5175, ...) and prints the real URL in the terminal — use whatever it actually prints, not blindly `:5173`.
>
> **3001 doesn't auto-shift** — if it's taken, the backend crashes on startup instead of picking another port. If you do need to change it, four places have to stay in sync or the Google login flow breaks: `.env`'s `PORT`, `.env`'s `GOOGLE_REDIRECT_URI`, the redirect URI registered on the OAuth client in Google Cloud Console, and the proxy target in `vite.config.js` (currently hardcoded to `http://localhost:3001`).

### 5. Run it

```bash
npm run dev:all
```

This runs the Vite dev server and the Express backend together. Open the URL Vite prints in the terminal (`http://localhost:5173` unless that port was taken). Connect Google Calendar from the sidebar whenever you're ready — notes work as soon as `.env` is filled in.

## Building the Mac App

Package the whole app — frontend and backend together — into a double-clickable Mac app:

```bash
npm run dist:mac
```

This builds the frontend and runs `electron-builder`, producing:
- `dist/mac-arm64/College Tracker.app` — the app itself; double-click to launch, or copy it into `/Applications`.
- `dist/College Tracker-*.dmg` — a disk-image installer, if you want to hand the app to yourself on another Mac or just prefer the familiar drag-to-Applications install flow.

The packaged app runs its own backend internally (forked as a child process) and stores your Google token in `~/Library/Application Support/College Tracker/`, separate from anything used in dev.

> [!WARNING]
> **This build bundles your `.env` file — including your live Google client secret and Notion API key — directly into the app.** That's a deliberate v1 shortcut for personal use, not a distribution-ready design. **Do not share the built `.app` or `.dmg` with anyone else** — doing so hands them your credentials. If you ever want to distribute this app to other people, it needs a per-user settings screen where each person enters their own Google/Notion keys, replacing the bundled `.env` approach entirely.

## Tech stack

React 19, Vite, Express 5, `googleapis`, the Notion API, and Electron/`electron-builder` for the Mac build.

## License

MIT — see [LICENSE](LICENSE).
