# MediBook Clinic — API (Backend)

REST API for the MediBook hackathon MVP. Pair with the UI repo:

- **UI:** https://github.com/devinaraina22/talentserv-ai-hackathon-group-23-UI
- **API:** https://github.com/devinaraina22/talentserv-ai-hackathon-group-23-backend

## Quick start

```bash
npm install
cp .env.example .env.local
npm run db:seed
npm run dev   # http://localhost:3001
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | API on port 3001 |
| `npm run build` | Production build |
| `npm run db:seed` | Reset `data/store.json` from seed |
| `npm test` | Vitest (`tests/booking.test.ts`) |
| `npm run reminders:due` | Day-before reminder emails |
| `npm run email:test you@x.com` | SMTP smoke test |

## Deploy (Vercel — API project)

1. Import this repo as a separate Vercel project.
2. Set `FRONTEND_URL` to your UI deployment URL (for CORS).
3. Add Clerk keys, SMTP, `CRON_SECRET`, and Upstash Redis (`KV_REST_*`).
4. Cron job runs `/api/cron/reminders` daily (see `vercel.json`).

## Environment variables

See `.env.example`. Required: Clerk keys. Production: Upstash Redis, SMTP (optional in dev).
