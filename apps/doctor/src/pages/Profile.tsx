import { useEffect, useRef, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { usePortalLogo } from "@/hooks/use-portal-logo";
import { useProfile, useUpdateProfile } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

function initials(name: string) {
  return name.replace(/^Dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function Profile() {
  const { logo, saveLogo } = usePortalLogo();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useProfile();
  const update = useUpdateProfile();
  const { f, seed, setF, dirty } = useForm({ name: "", specialization: "", phone: "", email: "" });

  useEffect(() => {
    if (data) seed({ name: data.name, specialization: data.specialization ?? "", phone: "", email: data.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({ name: f.name, specialization: f.specialization });
      toast.success("Profile saved.");
      seed({ ...f });
    } catch {
      toast.error("Could not save.");
    }
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPG or WebP image.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Choose an image smaller than 2 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Invalid image."));
        image.src = url;
      });
      saveLogo(url);
      toast.success("Practice logo updated.");
    } catch {
      toast.error("Could not save the logo. Try a smaller image and allow browser storage.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  if (isLoading || !data) return <Skeleton className="mx-auto h-72 max-w-lg" />;

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">{initials(data.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{data.name}</CardTitle>
            <div className="text-[13px] text-muted-foreground">{data.clinicName}</div>
          </div>
        </CardHeader>
        <CardContent>
          <section className="mb-6 rounded-xl border bg-secondary/40 p-4" aria-labelledby="practice-logo-heading">
            <h2 id="practice-logo-heading" className="text-sm font-semibold">Practice logo</h2>
            <p className="mt-1 text-xs text-muted-foreground">Appears at the top of your sidebar. Saved for your account in this browser.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-28 items-center justify-center rounded-lg border bg-white p-2">
                {logo ? <img src={logo} alt="Practice logo preview" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="size-7 text-muted-foreground" />}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload practice logo" className="sr-only" onChange={(e) => void uploadLogo(e.target.files?.[0])} />
                <Button type="button" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}><Upload />{uploading ? "Uploading..." : logo ? "Change logo" : "Upload logo"}</Button>
                <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP · up to 2 MB</span>
                {logo && <Button type="button" variant="ghost" size="sm" onClick={() => { try { saveLogo(null); toast.success("Practice logo removed."); } catch { toast.error("Could not remove the logo."); } }}>Remove logo</Button>}
              </div>
            </div>
          </section>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="Full name" value={f.name} onChange={(e) => setF("name", e.target.value)} />
            <TextField label="Specialization" value={f.specialization} onChange={(e) => setF("specialization", e.target.value)} />
            <TextField label="Email" value={f.email} disabled hint="Contact support to change your sign-in email." />
            {dirty && (
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => seed({ name: data.name, specialization: data.specialization ?? "", phone: "", email: data.email })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save changes"}</Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
