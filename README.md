# MediBank doctor UI demo

The complete portal uses bundled sample data, with no backend requests, API proxy, service worker, or external font requests. It opens with an approved Pro doctor session and a sample patient selected. Signing out and signing in work locally; any credentials can be used for the demo. Recovery and verification use demo code `123456`.

Lists, charts, clinical records, clinic settings, billing, support and notifications use local fixtures. Profiles, account preferences, clinic membership, assigned working hours, clinic profiles, and simulated subscription orders persist in browser storage. Other clinical fixtures and uploaded report files remain in browser memory; seeded reports show a clearly labelled sample document. Checkout uses a local simulated payment result and never charges money.

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

Individual Settings tabs remain Account & security, Subscription, and Contact us across routes; clinic management is still in the sidebar. Account preferences include demo MFA, an active inactivity timeout, account-scoped logout everywhere, English display language, and a personal referral link to registration. The referral code is captured in application data. MFA uses `123456`, sends no real messages, and is enforced on the local sign-in flow while enabled. Revoked demo sessions remain revoked after reload or waking a sleeping tab; unrelated demo accounts stay signed in. Real session revocation across devices requires a backend.

Subscriptions offer only 6 months or Annual. Illustrative totals use the existing monthly fixture rates multiplied by 6 or 12, with no assumed discount. Renewals extend the current expiry, use a unique simulated order, and add an account-scoped Payment History entry. Orders and subscription state persist on reload. Business-approved pricing, real payments, secure MFA, and shared storage across devices require production services.

Help & Tutorial includes FAQs and step-by-step guides for the new profile, membership, hours, security and renewal workflows. Regression tests in `profile-settings.test.ts` cover approval permissions, pending membership isolation, owner protection, temporary-hour validation, MFA verification and renewal periods.

## Verify the complete clinic flow

Sign in as `dr.mehta@test.com` and request City Care Clinic from Profile > Linked Clinics. In another tab, sign in as `dr.shah@test.com` to review the request as that clinic's principal doctor. These are sample accounts; use `doctor123` as the demo password. Requests and approvals synchronize across tabs. Approved doctors appear in Clinic settings > Doctors, where the principal can expand Working hours to assign their schedule. The doctor's Linked Clinics view displays the same schedule. Removing the member removes them from both views. `dr.kumar@test.com` is the principal of Community Health Centre.

Basic accounts can manage clinic links and see assigned working hours, but cannot fetch appointments or see Today's Appointments on Home. `reference-flows.test.ts` verifies shared approval and removal, schedule assignment, browser persistence, referral links, and account-scoped revocation. Open product decisions are listed in [reference-decisions.md](docs/reference-decisions.md).
