# PRD — College Tracker ("everything in one place")

Product requirements for a unified college calendar, assignment, and notes
tracker. This is a **living document** — it captures the full vision but is
built in versions. Update it as the project evolves.

Owner: (you)
Status: Draft v0.1
Last updated: 2026-08-12

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

A **dashboard** showing both:
- A calendar view (assignments + exams plotted by date)
- A list view (upcoming items sorted by due date)

---

## 5. Versioned scope

The full feature set is the goal. It ships in stages so each stage is a
working, testable app — not a half-built everything.

### v1 — Local app, fake data, NO integrations  ← we build this first
The container that everything else plugs into later.
- Dashboard: calendar view + upcoming-list view
- Manually add / edit / delete: **assignments** (title, class, due date) and
  **exams** (title, class, date)
- Data stored locally (no external accounts yet)
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
- Notes surfaced per class on the dashboard

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

---

## 8. How this doc is used

- This PRD is the shared source of truth between me and Claude Code.
- A condensed version of the "current version" scope will live in the project's
  `CLAUDE.md` so the agent reads it every session.
- Update this file whenever scope changes. Plan enough to aim; build to learn.
