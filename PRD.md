# PRD — College Tracker ("everything in one place")

Product requirements for a unified college calendar, assignment, and notes
tracker. This is a **living document** — it captures the full vision but is
built in versions. Update it as the project evolves.

Owner: (you)
Status: v1 complete; v2 (Google Calendar) built and expanded well beyond the
original read-only plan — see §5
Last updated: 2026-08-14

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

A left sidebar with five tabs — **Calendar, Tasks, Events, Notes, Add** —
Calendar is the default. Each list/calendar tab gets the full content area to
itself (no scrolling past a form to see it); adding or editing an item
happens on its own **Add** tab, which the app switches to automatically when
you click Edit anywhere (or "Add task"/"Add event" from a list tab, which
pre-selects that kind) and returns you to wherever you were once you save or
cancel. The sidebar also shows Google Calendar connection status and a
Connect/Disconnect control (§5, v2).

- **Calendar** — Month / Week / Day views (segmented switcher, Prev / Today /
  Next). Month shows a traditional grid; Week and Day are Google-Calendar-style
  time grids, with an all-day row for Tasks up top and Events rendered as
  positioned blocks spanning their start–end time (overlapping events lay out
  side by side instead of stacking). Recurring events appear on every day they
  occur, same as any other event — the calendar never collapses a series.
- **Tasks** — originally part of a combined Assignments list, now its own
  tab (date only, no time). Supports:
  - A **Date / Class / Type** grouping toggle — Date is the flat list
    (original behavior); Class and Type bucket tasks into labeled sections,
    sorted by due date within each section, with a guaranteed "No
    class"/"Unassigned" bucket for anything blank (nothing is ever dropped).
  - A **done checkbox** per task (separate from the bulk-select checkbox) that
    marks it completed and hides it from the active list, without deleting
    it. A "Show completed (N)" toggle reveals a Completed section, itself
    grouped the same way as the active list. Un-checking restores a task to
    its normal spot. A failed toggle reverts the checkbox and shows an error
    rather than pretending it worked.
  - Multi-select with "select all" and a bulk delete action (see below).
- **Events** — the timed half of the old Assignments list, now its own tab,
  split into two sections:
  - **One-time** — individual events (exams, quizzes, etc.), listed by date.
    Events whose end time has already passed drop out of this list
    automatically (they remain fully visible on the Calendar tab).
  - **Recurring** — detected from Google's recurrence data. Each recurring
    series (e.g. a class meeting 3x/week) appears once, showing its inferred
    pattern (e.g. "Mon/Wed/Fri 9:00 AM – 9:50 AM," derived from the full,
    unfiltered occurrence history so the pattern doesn't thin out as old
    occurrences drop off the list). "View occurrences" expands the series to
    individual rows for editing/deleting one occurrence at a time — the app
    deliberately does not offer whole-series edit/delete.
  - Multi-select with "select all" and a bulk delete action, scoped to
    whatever is individually visible/expanded at the time.
- **Notes** — a nested folder tree (create / rename / delete, unlimited
  depth, deleting warns first since it cascades to subfolders). No note
  *contents* yet — see open questions.
- **Add** — the add/edit form, described in full under v1 below.

### Shared list behavior (Tasks and Events)

Both list tabs share the same underlying pieces: a reusable row component,
a bulk-selection hook, and a confirmation dialog.

- **Multi-select delete** — checkboxes per row, a "select all," and a
  labeled "Delete selected" action. The exact set of items to delete is
  frozen at the moment the confirmation dialog opens (never silently
  recomputed if the list changes underneath it). The confirmation states
  exactly how many items will be deleted, lists them, and explicitly calls
  out how many will also be removed from Google Calendar vs. local-only.
  Deletion runs sequentially and stops at the first failure, reporting
  exactly which items succeeded, which one failed, and which were never
  attempted — never a silent partial failure.
- Every destructive action (single or bulk delete) goes through the shared
  confirmation dialog; nothing is removed from the UI or from Google until
  the operation actually succeeds.

---

## 5. Versioned scope

The full feature set is the goal. It ships in stages so each stage is a
working, testable app — not a half-built everything.

### v1 — Local app, fake data, NO integrations  ← done
The container that everything else plugs into later.
- Sidebar navigation: Calendar / Assignments (later split into Tasks +
  Events, see below) / Notes / Add tabs (§4)
- Every item is either a **Task** (date only) or an **Event** (date + start
  time + end time) — chosen first when adding/editing. This is independent
  of **type**: a free-text field (with common choices like homework, quiz,
  paper, project, exam offered as suggestions, plus N/A) — so e.g. an
  in-class quiz can be an Event and a take-home quiz a Task
- Shared fields on both kinds: title, class, description, date. Estimated
  time (minutes/hours) is Task-only — an Event's start/end already implies
  duration, so the field is hidden for Events
- Manually add / edit / delete items; delete always confirms first via a
  reusable confirmation dialog (used for items, folders, and later Google
  events too)
- Calendar renders both kinds across Month, Week, and Day views (§4)
- Notes: nested folder tree, unlimited depth, persisted locally — **not yet**
  wired to actual note content or to classes/items (see open questions)
- Data stored in `localStorage` when not connected to Google (see v2); items
  saved before Task/Event existed are migrated automatically on load
  (treated as Tasks unless they already had a time)
- Full dark "Jarvis / Iron Man HUD" visual restyle: near-black background,
  glowing cyan hairline borders/lines instead of solid fills, monospace/
  precise-sans type for labels and data — applied app-wide, functionality
  unchanged

### v2 — Google Calendar integration ← done, expanded well beyond the
### original read-only plan
The original plan here was read-only display. Partway through, the actual
goal turned out to be bigger: **College Tracker is the primary hub; Google
Calendar exists only as the phone/read view.** So instead, this became full
two-way sync with Google as the source of truth once connected:
- Express backend (`server/`) holds the OAuth client secret and refresh
  token (`server/tokens.json`, gitignored) so the connection persists across
  days without re-authenticating each session; frontend never sees the
  secret
- Every item created in the app — Tasks and Events alike — writes to Google
  automatically when connected, with no per-item "push to Google" checkbox.
  Tasks are stored as Google **all-day** events (the simplest representation
  that still shows correctly on a phone calendar)
- Editing or deleting an item in the app edits/deletes the corresponding
  Google event; deleting removes it from Google too (confirmations say so
  explicitly, §4)
- The app re-fetches from Google on load, on window focus, and via a manual
  refresh, so items added on a phone/other device show up here too
- App-only fields (type, class, completion) round-trip through Google via
  `extendedProperties.private`, since Google has no native equivalent —
  Google's own calendar UI won't show them, but they survive edits/refetches
  and sync across devices through the app
- Items created while **not** connected to Google fall back to
  `localStorage`, same as v1
- Recurring events (e.g. a class meeting 3x/week) are read via Google's
  `singleSeries`/per-occurrence expansion; the app understood early that
  editing/deleting one occurrence must never silently affect the whole
  series, and confirmed this is in fact how the underlying API calls behave
  before shipping the recurring-events UI (§4)
- Task completion ("done" checkbox, hidden from the active list but
  recoverable) piggybacks on the same `extendedProperties` mechanism so it
  syncs across devices, with a plain local field for locally-created tasks

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
- Tech stack: decided — React 19 + Vite frontend (plain CSS, no Tailwind),
  Express backend for the Google OAuth/Calendar proxy.
- Notes folders exist but are empty — what goes inside one? Free-text notes,
  file/link attachments, or a link to a class's items? Decide before building
  folder contents.

---

## 8. How this doc is used

- This PRD is the shared source of truth between me and Claude Code.
- A condensed version of the "current version" scope will live in the project's
  `CLAUDE.md` so the agent reads it every session.
- Update this file whenever scope changes. Plan enough to aim; build to learn.
