# Decisions still needed from the reference pictures

The clear UI and offline behavior is implemented. These details are not specified in the pictures:

1. **Display languages:** Which languages should be available? English is currently available. Translated UI copy needs approval before adding a language that changes the whole portal.
2. **MFA:** Should verification use an authenticator app, SMS, email, or another method? Which delivery/authentication service should the production app use? The demo verification flow uses `123456` and does not provide production security.
3. **Subscription pricing:** What are the approved Basic and Pro totals for six months and one year, including any discounts and taxes? Existing fixture rates are used only for illustrative totals. A real payment gateway/backend is absent from this repository.
4. **Temporary clinic operations:** The picture says “as discussed,” but those details were not supplied. Dated hours, closure, and a notes field are implemented. It remains unclear whether operational changes should disable particular services, notify patients, or reschedule existing appointments.
5. **Principal doctor leaving:** What should happen to clinic ownership, staff, and appointments if the principal doctor chooses Remove Clinic? Regular members can leave; owners remain protected until an ownership-transfer or clinic-closure rule is defined.

Referral links now point to the application's registration route with the doctor's unique referral code, which is preserved in application data. No rewards or incentives are assumed because the pictures do not request them. A different public referral destination requires its URL.

Production service dependencies are separate from unclear requirements: shared server storage, secure authentication/session revocation across devices, real MFA delivery, and payment integration require a backend and provider configuration. The current implementation is an offline browser demo. Profiles, clinic membership, schedules, preferences, temporary hours, and simulated orders now persist in browser storage; sample clinical records still use in-memory fixtures.
