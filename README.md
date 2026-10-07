# medibank-doctor-UI

this is a test


Doctor portal for MediBank. Separate frontend, shares the `medibank-api` backend and the
`@myanodex/shared` package with the patient app.

- Stack: Vite + React 18 + react-router 6 + TanStack Query 5 + Tailwind (shadcn style).
- Design: simple, clean, utilitarian clinical tool. Flat surfaces, dense tables, keyboard-first.
- Backend: not wired yet. The UI runs on **MSW mock data** in dev (`VITE_ENABLE_MOCKS=true`).
  Point `VITE_API_URL` at `medibank-api`'s `/api/v1/doctor` and disable mocks to go live.

## Commands (from repo root)

```
pnpm install
pnpm dev         # vite dev server, MSW mocks on
pnpm typecheck   # tsc -p tsconfig.app.json
pnpm test        # tsx unit tests
pnpm build       # production build to apps/doctor/dist
```

## Layout

- `apps/doctor` — the SPA.
- `packages/shared` — `@myanodex/shared`: zod schemas, constants, the app-agnostic api-client.
  Copied from the patient repo; keep in sync by hand.
