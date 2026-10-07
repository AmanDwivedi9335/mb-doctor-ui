# MediBank doctor UI demo

The complete portal uses bundled sample data, with no backend requests, API proxy, service worker, or external font requests. It opens with an approved Pro doctor session and a sample patient selected. Signing out and signing in work locally; any credentials can be used for the demo. Recovery and verification use demo code `123456`.

Lists, charts, clinical records, clinic settings, billing, support and notifications use local fixtures. Form changes are held in memory and reset when the page reloads. Uploaded report files remain in browser memory; seeded reports show a clearly labelled sample document. Checkout uses a local simulated payment result and never charges money.

Run from the repository root:

```
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

Sample patient MID: `22052661001002` (Priya Sharma). Demo fixtures live in `apps/doctor/src/mocks/fixtures`; local data operations live in `apps/doctor/src/mocks/handlers.ts` and `demo-extras.ts`.
