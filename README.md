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

## Profile and settings changes

Profile has My Profile, My Clinic Profile, and Linked Clinics tabs. Personal details support multiple specialisations; qualifications include a year; professional experience is optional and repeatable. Clinic details and opening hours are separate cards. Temporary changes use inclusive start/end dates, cannot overlap, and override normal hours during booking without rewriting the weekly schedule.

Linked Clinics is available on Basic and Pro. Requests stay pending until the principal doctor approves them. Principal doctors review requests in Linked Clinics or Clinic settings > Doctors. Approved members can leave; pending requests can be cancelled. Owners must transfer ownership before leaving (ownership transfer is outside this demo). Expanded rows show the doctor's assigned hours, not clinic opening hours. Appointment routes require Pro.

Individual Settings tabs remain Account & security, Subscription, and Contact us across routes; clinic management is still in the sidebar. Account preferences include demo MFA, an active inactivity timeout, logout everywhere across open demo tabs, English display language, and an illustrative referral link. MFA uses `123456`, sends no real messages, and is enforced on the local sign-in flow while enabled. Additional languages need approved translations; referral rewards and production session revocation need backend integration.

Subscriptions offer only 6 months or Annual. Illustrative totals use the existing monthly fixture rates multiplied by 6 or 12, with no assumed discount. Renewals extend the current expiry, use a unique simulated order, and add a Payment History entry. Payment navigation stays within the app to retain session-local demo state. Business-approved pricing, real payments, secure MFA, persistent memberships and preferences, and principal notifications require production services. Demo data still resets on reload.

Help & Tutorial includes FAQs and step-by-step guides for the new profile, membership, hours, security and renewal workflows. Regression tests in `profile-settings.test.ts` cover approval permissions, pending membership isolation, owner protection, temporary-hour validation, MFA verification and renewal periods.
