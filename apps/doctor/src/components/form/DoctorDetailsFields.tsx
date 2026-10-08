import { useRef } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { TextField } from "./FormKit";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { DoctorUser } from "@/types";

export type DoctorEducation = { qualification: string; college: string; city: string; state: string; country: string };
export type DoctorDetails = {
  name: string; preferredName: string; dateOfBirth: string; email: string;
  mobile: string; emergencyMobile: string; specialization: string; avatarUrl: string;
  registrationIds: string[]; education: DoctorEducation[]; adminPortalRequested: boolean;
};
export const blankEducation = (): DoctorEducation => ({ qualification: "", college: "", city: "", state: "", country: "" });
export function doctorDetails(data?: Partial<DoctorUser>): DoctorDetails {
  return {
    name: data?.name ?? "", preferredName: data?.preferredName ?? "", dateOfBirth: data?.dateOfBirth ?? "",
    email: data?.email ?? "", mobile: data?.mobile ?? "", emergencyMobile: data?.emergencyMobile ?? "",
    specialization: data?.specialization ?? "", avatarUrl: data?.avatarUrl ?? "",
    registrationIds: data?.registrationIds ? [...data.registrationIds] : [data?.registrationNo ?? ""],
    education: data?.education ? data.education.map((entry) => ({ ...entry })) : [blankEducation()],
    adminPortalRequested: data?.adminPortalRequested ?? false,
  };
}

export function DoctorDetailsFields({ value, onChange, emailDisabled, registrationRequired = false }: {
  value: DoctorDetails; onChange: (value: DoctorDetails) => void; emailDisabled?: boolean; registrationRequired?: boolean;
}) {
  const photo = useRef<HTMLInputElement>(null);
  const set = <K extends keyof DoctorDetails>(key: K, next: DoctorDetails[K]) => onChange({ ...value, [key]: next });
  async function pickPhoto(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG, JPG or WebP image up to 2 MB.");
      if (photo.current) photo.current.value = "";
      return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read photo."));
        reader.readAsDataURL(file);
      });
      set("avatarUrl", url);
    } catch { toast.error("Could not read your photo."); }
    finally { if (photo.current) photo.current.value = ""; }
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="flex flex-col items-center gap-2">
          <button type="button" onClick={() => photo.current?.click()} aria-label={value.avatarUrl ? "Change photo" : "Add photo"} className="flex h-28 w-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border bg-secondary/30 text-xs text-muted-foreground">
            {value.avatarUrl ? <img src={value.avatarUrl} alt="Doctor profile" className="size-full object-cover" /> : <><Upload className="size-6" />Add photo</>}
          </button>
          <input ref={photo} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Doctor photo" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
          {value.avatarUrl && <Button type="button" variant="ghost" size="sm" onClick={() => set("avatarUrl", "")}>Remove photo</Button>}
          <span className="text-[10px] text-muted-foreground">Up to 2 MB</span>
        </div>
        <div className="grid gap-3">
          <TextField label="Full legal name" value={value.name} onChange={(e) => set("name", e.target.value)} required />
          <TextField label="Preferred name" value={value.preferredName} onChange={(e) => set("preferredName", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Date of birth" type="date" value={value.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        <TextField label="Email" type="email" value={value.email} disabled={emailDisabled} onChange={(e) => set("email", e.target.value)} required hint={emailDisabled ? "Contact support to change your sign-in email." : undefined} />
        <TextField label="Mobile number" type="tel" value={value.mobile} onChange={(e) => set("mobile", e.target.value)} required />
        <TextField label="Emergency mobile number" type="tel" value={value.emergencyMobile} onChange={(e) => set("emergencyMobile", e.target.value)} />
        <TextField label="Specialization" value={value.specialization} onChange={(e) => set("specialization", e.target.value)} />
      </div>
      <section className="flex flex-col gap-3 border-t pt-4" aria-label="License and registration IDs">
        <h3 className="text-sm font-semibold">License / Registration IDs</h3>
        {value.registrationIds.map((id, index) => <div key={index} className="flex items-end gap-2">
          <TextField className="flex-1" label={`License / Registration ID ${index + 1}`} value={id} required={registrationRequired} onChange={(e) => set("registrationIds", value.registrationIds.map((entry, i) => i === index ? e.target.value : entry))} />
          <Button type="button" variant="ghost" size="icon" aria-label={`Delete registration ID ${index + 1}`} onClick={() => set("registrationIds", value.registrationIds.filter((_, i) => i !== index))}><Trash2 className="text-destructive" /></Button>
        </div>)}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set("registrationIds", [...value.registrationIds, ""])}><Plus />Add registration ID</Button>
      </section>
      <section className="flex flex-col gap-3 border-t pt-4" aria-label="Qualifications">
        <h3 className="text-sm font-semibold">Qualifications</h3>
        {value.education.map((entry, index) => <div key={index} className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium">Qualification {index + 1}</span><Button type="button" variant="ghost" size="icon" aria-label={`Delete qualification ${index + 1}`} onClick={() => set("education", value.education.filter((_, i) => i !== index))}><Trash2 className="text-destructive" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([ ["qualification", "Qualification"], ["college", "Medical college name"], ["city", "City"], ["state", "State"], ["country", "Country"] ] as const).map(([key, label]) => <TextField key={key} label={label} value={entry[key]} onChange={(e) => set("education", value.education.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} />)}
          </div>
        </div>)}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set("education", [...value.education, blankEducation()])}><Plus />Add qualification</Button>
      </section>
      <label className="flex items-center gap-2 border-t pt-4 text-sm"><input type="checkbox" checked={value.adminPortalRequested} onChange={(e) => set("adminPortalRequested", e.target.checked)} />Request access to Admin Portal</label>
    </div>
  );
}
