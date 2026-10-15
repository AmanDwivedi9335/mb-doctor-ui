export const tutorials = [
  {
    title: "Complete your profile",
    steps: [
      "Open the profile menu and choose Profile → My Profile.",
      "Update personal details, add each specialisation and registration ID.",
      "Add qualifications with their qualification year. Optionally add professional experience with title, organisation and dates.",
      "Choose Save changes. Leave the experience end date blank for a current role.",
    ],
  },
  {
    title: "Link or leave a clinic",
    steps: [
      "Open Profile → Linked Clinics and choose Add Clinic.",
      "Select the clinic and send a request to its principal doctor.",
      "The clinic stays marked Pending Approval until the principal doctor approves it.",
      "Expand a clinic row to view and set your own timings. Once approved, use Remove Clinic to leave; a pending request can be cancelled.",
    ],
  },
  {
    title: "Review a clinic link request",
    steps: [
      "As the principal doctor, open Clinic settings → Doctors. Clinic link requests are shown only there.",
      "Review the doctor and clinic listed in Clinic link requests.",
      "Choose Approve to link the doctor or Reject to decline. Other doctors cannot approve the request.",
      "After approval, open Clinic settings → Doctors and expand Working hours to assign that doctor’s weekly schedule.",
    ],
  },
  {
    title: "Update clinic opening hours",
    steps: [
      "Select your clinic in the top bar, then open Profile → My Clinic Profile.",
      "Set the normal weekly opening and closing times; mark closed days.",
      "For a temporary change, add a start date, end date, changed hours or closure, and an operations note.",
      "Keep date ranges separate and choose Save changes. Temporary records do not overwrite the weekly schedule.",
    ],
  },
  {
    title: "Transfer clinic ownership",
    steps: [
      "As the current principal, choose Transfer ownership for your clinic in Linked Clinics or Clinic settings → Doctors.",
      "Search registered doctors by name, email or doctor ID and select the new principal.",
      "Confirm the transfer. You remain a linked doctor and can remove yourself afterward.",
    ],
  },
  {
    title: "Publish a clinic notice",
    steps: [
      "Select your clinic and open My Clinic Profile → Opening hours → Clinic noticeboard.",
      "Choose Add notice, select the start and end dates, and write your message.",
      "Save changes. The message appears in clinic and doctor listings during that date range, including both dates.",
      "Edit or remove the notice here when needed. A notice does not change clinic hours or appointments.",
    ],
  },
  {
    title: "Renew your subscription",
    steps: [
      "Open Settings → Subscription.",
      "Choose 6 months or Annual and check the displayed price.",
      "Choose Renew for the current plan, or choose an eligible plan.",
      "Review the simulated payment result and Payment History. The purchased period extends the current expiry date.",
    ],
  },
  {
    title: "Manage account security",
    steps: [
      "Open Settings → Account & security.",
      "Set up MFA and verify with the local demo code 123456.",
      "Choose your inactivity timeout. The portal signs out when no activity is detected for that period.",
      "Use Logout everywhere to end demo sessions on open tabs. Copy your referral link from Account preferences.",
    ],
  },
];
export const profileFaqs = [
  {
    id: "faq-profile",
    question: "Can I list more than one specialisation?",
    answer:
      "Yes. Open My Profile and choose Add specialisation for each field of practice. Save your changes when finished.",
  },
  {
    id: "faq-experience",
    question: "Is professional experience required?",
    answer:
      "No. Professional Experience is optional. Add any roles you want to include; leave To blank for a current position.",
  },
  {
    id: "faq-link",
    question: "Why does a clinic show Pending Approval?",
    answer:
      "You have requested to join the clinic. Its principal doctor must approve the request before your membership becomes active. You can cancel your request while waiting.",
  },
  {
    id: "faq-basic",
    question: "Can Basic doctors manage linked clinics?",
    answer:
      "Yes. Basic doctors can view clinic links, request to join, leave a clinic, and view and edit their own working hours. Appointment access requires Pro.",
  },
  {
    id: "faq-hours",
    question: "Are my working hours the same as clinic opening hours?",
    answer:
      "No. Linked Clinics shows the hours assigned to you at that clinic. My Clinic Profile shows the clinic’s regular opening hours and temporary changes.",
  },
  {
    id: "faq-owner",
    question: "Why can’t I remove my own clinic?",
    answer:
      "Choose Transfer ownership in Linked Clinics or Clinic settings → Doctors, search for a registered doctor, select them and confirm. You remain linked as a member and can then choose Remove Clinic.",
  },
  {
    id: "faq-renew",
    question: "Which subscription periods are available?",
    answer:
      "Choose 6 months or Annual. There is no monthly purchase option. Prices and payment results in this demo are illustrative and no money is charged.",
  },
  {
    id: "faq-mfa",
    question: "Does MFA send a real code in this demo?",
    answer:
      "No. The demo uses code 123456 to set up, disable, and sign in with MFA. Production MFA requires a secure verification service.",
  },
  {
    id: "faq-language",
    question: "Which display languages are available?",
    answer:
      "English is currently available. Additional languages will be added when approved translations are supplied.",
  },
];
