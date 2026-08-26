# Frontend — AI Support Ticket System

React + Vite + Tailwind + React Router.

## Run it

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to point at the FastAPI backend (default `http://localhost:8000/api`).

## Three UIs, one app

The app has three role-based experiences, gated by `ProtectedRoute` + `RoleContext`:

- **Customer** — `/tickets/new`, `/tickets` (submit + track tickets)
- **Agent** — `/agent/dashboard`, `/agent/tickets/:id` (queue, reply, AI-suggested replies, SLA countdowns)
- **Admin** — `/admin/analytics`, `/admin/settings` (users, categories, SLA policy config)

Login redirects each role to its home route automatically (`RoleContext.homeRoute`).

## Additions beyond the original folder list

A few files weren't in the shared structure but are needed to make it a working app:
- `pages/Login.jsx`, `pages/Register.jsx` — auth screens (backend already has `auth.py`)
- `components/common/Navbar.jsx`, `ProtectedRoute.jsx` — shared layout/route guarding
- `services/adminService.js` — API calls for the admin pages (maps to `backend/app/api/routes/admin.py`)

Everything else follows the structure exactly as given.
