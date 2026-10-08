import { useRef, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { usePortalLogo } from "@/hooks/use-portal-logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function ClinicLogo() {
  const { logo, saveLogo } = usePortalLogo();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      toast.success("Clinic logo updated.");
    } catch {
      toast.error("Could not save the logo. Try a smaller image and allow browser storage.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <section aria-labelledby="clinic-logo-heading">
      <h2 id="clinic-logo-heading" className="text-sm font-semibold">Clinic logo</h2>
      <p className="mt-1 text-xs text-muted-foreground">Appears at the top of your sidebar. Saved for your account in this browser.</p>
      <div className="mt-3 flex flex-col items-start gap-3">
        <div className="flex h-20 w-28 items-center justify-center rounded-lg border bg-white p-2">
          {logo ? <img src={logo} alt="Clinic logo preview" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="size-7 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload clinic logo" className="sr-only" onChange={(e) => void uploadLogo(e.target.files?.[0])} />
          <Button type="button" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}><Upload />{uploading ? "Uploading..." : logo ? "Change logo" : "Upload logo"}</Button>
          <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP · up to 2 MB</span>
          {logo && <Button type="button" variant="ghost" size="sm" onClick={() => { try { saveLogo(null); toast.success("Clinic logo removed."); } catch { toast.error("Could not remove the logo."); } }}>Remove logo</Button>}
        </div>
      </div>
    </section>
  );
}
