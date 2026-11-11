# arrear.

A single-page **arrear management** workspace for students: track backlogs, current papers and upcoming exams, study from your own notes with a local AI helper, get deadline alerts, and explore career paths that fit your registered course.

**Live demo:** <https://balabm.github.io/arrear-management/>

## Run it

No build step or dependencies. Serve the folder over HTTP (localStorage and ES modules need an origin):

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173>.

You can also double-click `index.html`, but a local server is recommended.

## Demo account

| Email             | Password   |
| ----------------- | ---------- |
| `demo@arrear.app` | `demo1234` |

The demo profile is seeded with B.Tech CSE Semester 5 data — 3 active arrears, 5 current papers, and exam dates relative to your sign-in date. Create your own account from the welcome page to start with an empty workspace and your own course/semester.

## What's inside

- **My courses** — old arrears, current papers and upcoming papers; add papers, record results, mark cleared.
- **Academics** — upload notes (TXT, MD, PDF) and ask questions; answers are extracted from your uploaded notes with citations plus paper context.
- **Alerts** — backlog and exam reminders, per-alert toggles, custom reminder dates, browser notifications.
- **Academic guidance** — interest-based career matching, strengths, and a 90-day action roadmap.
- **Overall dashboard** — KPIs, SGPA trend, clearance donut, calendar, and a filterable record table with CSV export.

## Notes

- Everything is stored locally in your browser (`arrear.users.v1`, `arrear.session.v1`, `arrear.data.v1::<email>`). Nothing is sent to a server.
- The StudyAI helper is local and note-grounded — it does not call an external model. PDF text extraction uses pdf.js from a CDN.
- Deleting the `arrear.data.v1::demo@arrear.app` localStorage key regenerates the demo seed on next visit.

## Files

```
index.html      entry point
app.js          auth, state, events, uploads, chat, export
views.js        welcome page + dashboard shell + courses
views2.js       academics, alerts, guidance, overview, modals
data.js         seed data, career catalog, scoring helpers
ai.js           local note-grounded answer engine
helpers.js      icons, dates, markdown rendering
styles/         base, welcome, shell, pages, extras, responsive
```
