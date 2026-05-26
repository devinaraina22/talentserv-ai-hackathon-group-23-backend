# MediBook Clinic — API (Backend)

REST API for the MediBook hackathon MVP. Pair with the UI repo:

- **UI:** https://github.com/devinaraina22/talentserv-ai-hackathon-group-23-UI
- **API:** https://github.com/devinaraina22/talentserv-ai-hackathon-group-23-backend

## Production storage (Postgres)

On **Vercel**, data is stored in **Neon Postgres** via `DATABASE_URL`. The app does **not** auto-seed at runtime — seed the database once manually, then all sessions persist.

| Environment | Storage |
|-------------|---------|
| **Vercel production** | Neon Postgres (`DATABASE_URL` required) |
| **Local dev** | `data/store.json` (when `DATABASE_URL` is unset) |

## Local development

```bash
npm install
cp .env.example .env.local   # Clerk keys only; no DATABASE_URL needed locally
npm run db:seed                # optional — fills data/store.json
npm run dev                    # http://localhost:3001
```

## One-time Postgres setup (production)

Run **once** after creating Neon in Vercel:

```bash
# With DATABASE_URL in .env.local (copy from Vercel → Storage → Neon)
npm run db:init    # creates medibook_store table
npm run db:seed    # loads demo data from data/seed.json into Postgres
```

Or run the same commands from your machine using `vercel env pull` for `DATABASE_URL`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | API on port 3001 |
| `npm run build` | Production build |
| `npm run db:init` | Create Postgres schema (needs `DATABASE_URL`) |
| `npm run db:seed` | **Manual** one-time seed into Postgres or local file |
| `npm test` | Vitest |
| `npm run reminders:due` | Day-before reminder emails |
| `npm run email:test you@x.com` | SMTP smoke test |

## Deploy on Vercel (API project)

1. Import this repo → new Vercel project (branch: `api-only`).
2. **Storage → Create Database → Neon Postgres** → link to this project.
3. Set environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Auto-set by Neon integration |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Same Clerk app as UI |
| `CLERK_SECRET_KEY` | Yes | Same Clerk app as UI |
| `FRONTEND_URL` | Yes | UI Vercel URL (CORS), e.g. `https://your-ui.vercel.app` |
| `ADMIN_EMAILS` | Yes | e.g. `devina.raina@talentserv.co.in` |
| `CRON_SECRET` | Yes | Random string for `/api/cron/reminders` |
| `SMTP_*` | Optional | Real appointment/reminder emails |

4. Deploy, then run **once** locally: `npm run db:init && npm run db:seed` (with production `DATABASE_URL`).
5. Cron runs daily at 9:00 UTC (`vercel.json` → `/api/cron/reminders`).

## CI

Unit tests use local file storage (no `DATABASE_URL`). Playwright e2e runs in the **UI repo**.

## Environment variables

See `.env.example`.
