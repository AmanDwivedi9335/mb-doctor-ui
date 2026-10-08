import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DoctorAuthProvider } from "@/contexts/DoctorAuthContext";
import { SelectedPatientProvider } from "@/contexts/SelectedPatientContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { Login } from "@/pages/Login";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { Recover } from "@/pages/Recover";
import { Apply } from "@/pages/apply/Apply";
import { Onboarding } from "@/pages/apply/Onboarding";
import { Pending } from "@/pages/apply/Pending";
import { Payment } from "@/pages/Payment";
import { Dashboard } from "@/pages/Dashboard";
import { PatientSearch } from "@/pages/PatientSearch";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { WalkIn } from "@/pages/WalkIn";
import { History } from "@/pages/History";
import { PatientWorkspace } from "@/pages/patient/PatientWorkspace";
import { ChangePassword } from "@/pages/ChangePassword";
import { Appointments } from "@/pages/Appointments";
import { Billing } from "@/pages/Billing";
import { Support } from "@/pages/Support";
import { PatientAnalytics, BillingAnalytics } from "@/pages/Analytics";
import { Notifications } from "@/pages/Notifications";
import { Profile } from "@/pages/Profile";
import { Help } from "@/pages/Help";
import { NotFound } from "@/pages/stubs";
import { SettingsLayout } from "@/pages/settings/SettingsLayout";
import { AccountSecurity } from "@/pages/settings/Account";
import { SecurityQuestions } from "@/pages/settings/SecurityQuestions";
import { ClinicProfile } from "@/pages/settings/ClinicProfile";
import { Doctors } from "@/pages/settings/Doctors";
import { Staff } from "@/pages/settings/Staff";
import { Subscription } from "@/pages/settings/Subscription";
import { ContactUs } from "@/pages/settings/ContactUs";

/** Home: a doctor lands on Search MID; the front desk has no consultation, so it lands on the dashboard. */
function Home() {
  const { user } = useAuth();
  return user?.role === "receptionist" ? <Dashboard /> : <PatientSearch />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DoctorAuthProvider>
        <SelectedPatientProvider>
          <Toaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/recover" element={<Recover />} />
            <Route path="/apply" element={<Apply />} />

            {/* Signed in, but not necessarily approved or paid. */}
            <Route path="/apply/onboarding" element={<ProtectedRoute stage="session"><Onboarding /></ProtectedRoute>} />
            <Route path="/apply/pending" element={<ProtectedRoute stage="session"><Pending /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute stage="session"><Payment /></ProtectedRoute>} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Navigate to="/" replace />} />
              <Route path="/patients/:mid" element={<PatientWorkspace />} />
              <Route path="/walk-in" element={<WalkIn />} />
              <Route path="/history" element={<History />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/analytics" element={<Navigate to="/analytics/patients" replace />} />
              <Route path="/analytics/patients" element={<PatientAnalytics />} />
              <Route path="/analytics/billing" element={<BillingAnalytics />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/help" element={<Help />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/account" replace />} />
                <Route path="account" element={<AccountSecurity />} />
                <Route path="security-questions" element={<SecurityQuestions />} />
                <Route path="clinic" element={<ClinicProfile />} />
                <Route path="doctors" element={<Doctors />} />
                <Route path="staff" element={<Staff />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="contact" element={<ContactUs />} />
                <Route path="faqs" element={<Navigate to="/help" replace />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SelectedPatientProvider>
      </DoctorAuthProvider>
    </BrowserRouter>
  );
}
