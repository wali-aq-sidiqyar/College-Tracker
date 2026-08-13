# PRD — College Tracker ("everything in one place")

Product requirements for a unified college calendar, assignment, and notes
tracker. This is a **living document** — it captures the full vision but is
built in versions. Update it as the project evolves.

Owner: (you)
Status: v1 in progress — item tracking, calendar, and a notes shell are built
Last updated: 2026-08-13

---

## 1. The problem

College info is scattered across BrightSpace (LMS), Outlook (school email +
calendar), Google Calendar (personal), and Notion (notes). There is no single
place to see "what's due, what's coming, and where are my notes for it." This
app is that single place.

## 2. The vision (the north star — NOT all v1)

One dashboard that pulls together:
- Assignments and their due dates
- Exam dates
- Class schedule / meeting times
- Notes per class (Notion-style)
- Grades / progress tracking

...sourced from BrightSpace, Outlook, Google Calendar, and Notion, all visible
in one place.

## 3. Who uses it

- Primarily: me, on my laptop.
- Later: possibly shared with classmates.
- **Implication:** build as a **web app** (runs in a browser). Runs locally on
  my laptop first; hosting/sharing is a later, optional step. No multi-user
  accounts in early versions.

## 4. First screen

A left sidebar with four tabs — **Calendar, Assignments, Notes, Add** — Calendar
is the default. Calendar and Assignments/Notes get the full content area to
themselves (no scrolling past a form to see them); adding or editing an item
happens on its own **Add** tab, which the app switches to automatically when
you click Edit anywhere and returns you to wherever you were once you save or
cancel.

- **Calendar** — Month / Week / Day views (segmented switcher, Prev / Today /
  Next). Month shows a traditional grid; Week and Day are Google-Calendar-style
  time grids, with an all-day row for Tasks up top and Events rendered as
  positioned blocks spanning their start–end time (overlapping events lay out
  side by side instead of stacking).
- **Assignments** — a flat list of every item sorted by due date, with a
  countdown ("in 3d", "2d ago").
- **Notes** — a nested folder tree (create / rename / delete, unlimited
  depth, deleting warns first since it cascades to subfolders). No note
  *contents* yet — see open questions.
- **Add** — the add/edit form, described in full under v1 below.

---

## 5. Versioned scope

The full feature set is the goal. It ships in stages so each stage is a
working, testable app — not a half-built everything.

### v1 — Local app, fake data, NO integrations  ← in progress, mostly built
The container that everything else plugs into later.
- Sidebar navigation: Calendar / Assignments / Notes / Add tabs (§4)
- Every item is either a **Task** (date only) or an **Event** (date + start
  time + end time) — chosen first when adding/editing. This is independent
  of **type**: assignment, homework, quiz, paper, project, or exam — so e.g.
  an in-class quiz can be an Event and a take-home quiz a Task
- Shared fields on both kinds: title, class, description, date. Estimated
  time (minutes/hours) is Task-only — an Event's start/end already implies
  duration, so the field is hidden for Events
- Manually add / edit / delete items; delete always confirms first via a
  reusable confirmation dialog (used for items and for folders)
- Calendar renders both kinds across Month, Week, and Day views (§4)
- Notes: nested folder tree, unlimited depth, persisted locally — **not yet**
  wired to actual note content or to classes/items (see open questions)
- Data stored in `localStorage` (no external accounts yet); items saved
  before Task/Event existed are migrated automatically on load (treated as
  Tasks unless they already had a time)
- Goal: a real, working app on screen that I can click around in

### v2 — First integration: Google Calendar
- Read events from my Google Calendar into the dashboard
- Learn the full shape of one integration (OAuth, API keys, scopes) once
- Google chosen first: best-documented, most student-accessible API

### v3 — More integrations, hardest last
- Outlook (school email/calendar)
- Notion (notes per class)
- BrightSpace / D2L LMS — **RISK: check early whether my school grants student
  API access at all. If not, this feature may be impossible as designed and
  need a workaround (e.g. manual import).**

### v4 — Remaining core features
- Class schedule / meeting times
- Grades / progress tracking
- Notes surfaced per class on the dashboard — the folder *tree* was pulled
  forward into v1 (§5 v1), but folders don't hold content or link to classes
  or items yet; that's the remaining piece of this item

### Later / maybe
- Share with classmates (hosting, multi-user, logins)
- Notifications / reminders

---

## 6. Explicit non-goals (for now)

- No mobile app (web app is reachable on a phone browser; native app is later).
- No multi-user accounts or sharing until the single-user app works well.
- No integration in v1 at all — on purpose.

---

## 7. Open questions / to confirm

- Does my school offer BrightSpace/D2L API access to students? (Check ASAP —
  gates v3.)
- Which is more urgent day to day: seeing due dates, or having notes linked?
- Tech stack: to be decided with Claude Code at build time (likely a simple
  web stack; keep it beginner-friendly).
- Notes folders exist but are empty — what goes inside one? Free-text notes,
  file/link attachments, or a link to a class's items? Decide before building
  folder contents.

---

## 8. How this doc is used

- This PRD is the shared source of truth between me and Claude Code.
- A condensed version of the "current version" scope will live in the project's
  `CLAUDE.md` so the agent reads it every session.
- Update this file whenever scope changes. Plan enough to aim; build to learn.
