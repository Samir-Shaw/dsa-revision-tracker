# DSA Revision Tracker

*Your problems. Your patterns. Your revision.*

A personal LeetCode / DSA problem management + pattern organization + revision +
practice + progress analytics platform, built React + Express + MySQL.

---

## 1. Stack

- **Frontend:** React 18 (Vite), React Router, Lucide React, Recharts, plain CSS
- **Backend:** Node.js + Express (REST API)
- **Database:** MySQL 8
- **Auth:** JWT in HTTP-only cookies, bcrypt password hashing
- **AI:** Gemini API, called only from the Express backend

## 2. Local setup

### Prerequisites
- Node.js 18+
- A running MySQL 8 server (local, Docker, or a hosted instance)
- (Optional, for Auto Categorize / AI import classification) a Gemini API key

### Steps

```bash
# 1. Install dependencies for both client and server
npm run install:all

# 2. Configure environment variables
cp .env.example server/.env
# edit server/.env with your DB credentials, a real JWT_SECRET, and (optionally) GEMINI_API_KEY

# 3. Create the database schema
npm run migrate

# 4. (Optional) Seed the demo/owner account with the 308-problem dataset
npm run seed
# prints the demo login (demo@dsarevisiontracker.app / DemoAccount123!) — change this password before deploying

# 5. Run both frontend and backend together
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

A brand-new signup always starts with **zero problems** — the seed script only
ever touches the one dedicated demo account, never a regular user's data.

## 3. Project structure

```
server/
  app.js              Express entrypoint
  config/             env + MySQL pool
  controllers/        route handlers
  middleware/         auth (JWT→userId), centralized error handler
  models/             parameterized SQL, always scoped to the authenticated user
  routes/             REST endpoints, grouped by resource
  services/           Gemini classification, import parsing, spaced-repetition logic
  migrations/         001_init_schema.sql — run this first
  scripts/            migrate.js, seedDemo.js
  seed/problems.json  your real 308-problem dataset, pre-classified

client/
  src/
    pages/            one file per route
    layouts/          sidebar app shell
    context/          AuthContext (cookie-based session)
    services/api.js   fetch wrapper, one function per endpoint
    styles/global.css dark, minimal design system
```

## 4. What's fully implemented

- Register / login / logout / forgot-password / reset-password / change-password,
  bcrypt hashing, HTTP-only JWT cookies, rate limiting on auth routes.
- Every problems/revisions/practice/lists query is scoped to `req.userId`
  (derived from the verified JWT) — never from client-supplied ids.
- Problems CRUD, search, filter, sort, favorites, notes.
- Import pipeline: TXT / CSV / JSON / paste → parse → duplicate detection →
  AI-assisted categorization → editable preview → confirmed insert (nothing
  is written to the DB before you click Confirm).
- Gemini classification service — key lives only in `server/.env`, called only
  from `server/services/geminiService.js`. If unset, Auto Categorize returns a
  clear "not configured" error rather than crashing.
- Spaced-repetition engine (`server/services/revisionService.js`) with the
  1/3/7/14/30-day schedule from the spec, editable per-user via Settings.
- Practice mode (single-problem flow + summary) and Random Practice
  (difficulty/pattern/source filters, scoped to the authenticated user).
- Analytics computed live from SQL (streaks, pattern accuracy, difficulty and
  pattern distribution, solved-over-time) — nothing hardcoded.
- JSON/CSV export of the user's own data only.
- Your real 308 solved problems, parsed from your LeetCode history export,
  deduplicated, and classified into DSA patterns — seeded **only** into the
  demo account.

## 5. What's stubbed or left for you to finish

This was generated in a sandboxed environment with no live MySQL server, no
network egress, and no hosting — so nothing here has been run against a real
database. Before you rely on it:

- **Run it locally first** and fix anything that doesn't match your exact
  MySQL/Node versions — the SQL and JS are written correctly against the
  documented APIs, but this hasn't executed end-to-end.
- **Email sending** for forgot-password is stubbed — it logs the reset token
  to the server console in development instead of emailing it. Wire up a real
  provider (Resend, SES, SendGrid) in `authController.js`.
- **Custom Lists UI** — the backend (CRUD + assign problems) is complete, but
  there's no dedicated page for it yet; wire a page against `listsApi`.
- **Import file upload for TXT/CSV/JSON** reads the file client-side and sends
  raw text — fine for reasonably sized files, but very large imports (5000+)
  would benefit from a streaming/chunked approach.
- **Deployment configs** (`vercel.json`, Render's build/start commands) aren't
  included — both are straightforward given this structure: point Vercel at
  `client/`, point Render at `server/` with `npm start`, and set the env vars
  from `.env.example` in each platform's dashboard.

## 6. Date data note

Your uploaded history mixed exact dates (`2025.08.25`) with relative/bare ones
(`Feb 4`, `Yesterday`, `2 hours ago`). Exact dates were kept as-is; the rest
were resolved to the most recent plausible calendar date and are flagged
`date_confidence: "inferred"` in `server/seed/problems.json` in case you want
to correct any by hand later.
