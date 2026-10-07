import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Upload } from "lucide-react";
import { authApi } from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { ApplyFrame } from "./Pending";

const GOV_ID_TYPES = ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"];
const DOCUMENTS = [
  { kind: "degree", label: "Degree certificate", field: "degreeCertificate" },
  { kind: "registration", label: "Council registration certificate", field: "registrationCertificate" },
  { kind: "gov_id", label: "Government ID", field: "govIdProof" },
] as const;

interface Application {
  name: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  mobile: string | null;
  qualification: string | null;
  specialization: string | null;
  registrationNo: string | null;
  medicalCouncil: string | null;
  registrationYear: string | null;
  experienceYears: number | null;
  govIdType: string | null;
  govIdNumber: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  clinicEmail: string | null;
  documents: { degreeCertificate: boolean; registrationCertificate: boolean; govIdProof: boolean };
  reviewStatus: string;
  reviewNote: string | null;
}

/**
 * The application form: registration details, government ID, practice
 * details and three document uploads. Saved as a draft; Submit hands it to an
 * admin. Editable again if it comes back rejected, with the reviewer's note.
 */
export function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const { f, setF, seed } = useForm({
    name: user?.name ?? "",
    gender: "",
    dateOfBirth: "",
    mobile: "",
    qualification: "",
    specialization: "",
    registrationNo: "",
    medicalCouncil: "",
    registrationYear: "",
    experienceYears: "",
    govIdType: "Aadhaar",
    govIdNumber: "",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
  });
  const [docs, setDocs] = useState({ degreeCertificate: false, registrationCertificate: false, govIdProof: false });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState<string | null>(user?.reviewNote ?? null);

  useEffect(() => {
    authApi
      .get<Application>("/auth/onboarding")
      .then((a) => {
        seed({
          name: a.name ?? "",
          gender: a.gender ?? "",
          dateOfBirth: a.dateOfBirth ?? "",
          mobile: a.mobile ?? "",
          qualification: a.qualification ?? "",
          specialization: a.specialization ?? "",
          registrationNo: a.registrationNo ?? "",
          medicalCouncil: a.medicalCouncil ?? "",
          registrationYear: a.registrationYear ?? "",
          experienceYears: a.experienceYears == null ? "" : String(a.experienceYears),
          govIdType: a.govIdType ?? "Aadhaar",
          govIdNumber: a.govIdNumber ?? "",
          clinicName: a.clinicName ?? "",
          clinicAddress: a.clinicAddress ?? "",
          clinicPhone: a.clinicPhone ?? "",
          clinicEmail: a.clinicEmail ?? "",
        });
        setDocs(a.documents);
        setReviewNote(a.reviewNote);
      })
      .catch(() => {
        /* a brand-new draft has nothing saved yet */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveForm(): Promise<boolean> {
    setSaving(true);
    try {
      await authApi.patch("/auth/onboarding", {
        name: f.name.trim() || undefined,
        gender: f.gender || undefined,
        dateOfBirth: f.dateOfBirth || undefined,
        mobile: f.mobile.trim(),
        qualification: f.qualification.trim(),
        specialization: f.specialization.trim(),
        registrationNo: f.registrationNo.trim(),
        medicalCouncil: f.medicalCouncil.trim(),
        registrationYear: f.registrationYear.trim() || undefined,
        experienceYears: f.experienceYears ? Number(f.experienceYears) : undefined,
        govIdType: f.govIdType,
        govIdNumber: f.govIdNumber.trim(),
        clinicName: f.clinicName.trim() || undefined,
        clinicAddress: f.clinicAddress.trim() || undefined,
        clinicPhone: f.clinicPhone.trim() || undefined,
        clinicEmail: f.clinicEmail.trim(),
      });
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save. Check the required fields.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: (typeof DOCUMENTS)[number]["kind"], field: keyof typeof docs, file: File) {
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file, file.name);
      await authApi.upload("/auth/onboarding/documents", form);
      setDocs((d) => ({ ...d, [field]: true }));
      toast.success("Uploaded.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function submit() {
    if (!(await saveForm())) return;
    setSubmitting(true);
    try {
      await authApi.post("/auth/apply/submit");
      await refreshSession();
      navigate("/apply/pending", { replace: true });
    } catch (err) {
      const body = err instanceof ApiError ? (err.data as { missing?: string[] } | undefined) : undefined;
      toast.error(body?.missing?.length ? `Still missing: ${body.missing.join(", ")}` : err instanceof ApiError ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ApplyFrame title="Your application" subtitle="An admin checks these details against the council register before your account is approved.">
      {reviewNote && user?.reviewStatus === "rejected" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-medium">Your last submission was not approved.</div>
          <div className="mt-1">{reviewNote}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" value={f.name} onChange={(e) => setF("name", e.target.value)} />
          <TextField label="Mobile" inputMode="tel" value={f.mobile} onChange={(e) => setF("mobile", e.target.value)} required />
          <SelectField label="Gender" value={f.gender} onValueChange={(v) => setF("gender", v)} options={["Male", "Female", "Other"]} placeholder="Select" />
          <TextField label="Date of birth" type="date" value={f.dateOfBirth} onChange={(e) => setF("dateOfBirth", e.target.value)} />
          <TextField label="Qualification" placeholder="MBBS, MD" value={f.qualification} onChange={(e) => setF("qualification", e.target.value)} required />
          <TextField label="Specialization" placeholder="General medicine" value={f.specialization} onChange={(e) => setF("specialization", e.target.value)} required />
          <TextField label="Registration number" value={f.registrationNo} onChange={(e) => setF("registrationNo", e.target.value)} required />
          <TextField label="Medical council" placeholder="Tamil Nadu Medical Council" value={f.medicalCouncil} onChange={(e) => setF("medicalCouncil", e.target.value)} required />
          <TextField label="Registration year" value={f.registrationYear} onChange={(e) => setF("registrationYear", e.target.value)} />
          <TextField label="Years of experience" inputMode="numeric" value={f.experienceYears} onChange={(e) => setF("experienceYears", e.target.value)} />
          <SelectField label="Government ID type" value={f.govIdType} onValueChange={(v) => setF("govIdType", v)} options={GOV_ID_TYPES} />
          <TextField label="Government ID number" value={f.govIdNumber} onChange={(e) => setF("govIdNumber", e.target.value)} required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice</CardTitle>
          <p className="text-[13px] text-muted-foreground">Printed on your prescriptions. Clinics with a front desk are set up later on the Pro plan.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <TextField label="Practice name" value={f.clinicName} onChange={(e) => setF("clinicName", e.target.value)} />
          <TextField label="Phone" value={f.clinicPhone} onChange={(e) => setF("clinicPhone", e.target.value)} />
          <TextField label="Address" className="sm:col-span-2" value={f.clinicAddress} onChange={(e) => setF("clinicAddress", e.target.value)} />
          <TextField label="Email" type="email" value={f.clinicEmail} onChange={(e) => setF("clinicEmail", e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
          <p className="text-[13px] text-muted-foreground">PDF or a clear photo (JPG, PNG), up to 10 MB each.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {DOCUMENTS.map((d) => (
            <label key={d.kind} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                {docs[d.field] ? <CheckCircle2 className="size-4 text-success" /> : <Upload className="size-4 text-muted-foreground" />}
                {d.label}
                {docs[d.field] && <span className="text-[12px] text-muted-foreground">uploaded</span>}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="max-w-[12rem] text-[12px]"
                disabled={uploading === d.kind}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(d.kind, d.field, file);
                }}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving} onClick={() => void saveForm().then((ok) => ok && toast.success("Saved."))}>
          {saving ? "Saving..." : "Save draft"}
        </Button>
        <Button disabled={submitting || saving} onClick={() => void submit()}>
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </div>
    </ApplyFrame>
  );
}
