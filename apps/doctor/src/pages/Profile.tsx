import { useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DoctorDetailsFields, doctorDetails } from "@/components/form/DoctorDetailsFields";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClinicProfile } from "@/pages/settings/ClinicProfile";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

function initials(name: string) {
  return name.replace(/^Dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function Profile() {
  const { user, refreshSession } = useAuth();
  const { data, isLoading } = useProfile();
  const update = useUpdateProfile();
  const { f, seed, setForm, dirty } = useForm(doctorDetails());

  useEffect(() => {
    if (data) seed(doctorDetails({ ...data, mobile: data.mobile ?? user?.mobile ?? "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const saved = await update.mutateAsync({ ...f, registrationNo: f.registrationIds.filter((id) => id.trim()).join(", ") });
      await refreshSession();
      toast.success("Profile saved.");
      seed(doctorDetails(saved));
    } catch {
      toast.error("Could not save.");
    }
  }

  if (isLoading || !data) return <Skeleton className="mx-auto h-72 max-w-lg" />;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Tabs defaultValue="my-profile">
        <TabsList className="search-appointment-tabs grid w-full grid-cols-2 items-stretch gap-0 border-0" aria-label="Profile sections">
          <TabsTrigger value="my-profile">My profile</TabsTrigger>
          <TabsTrigger value="my-clinic">My clinic profile</TabsTrigger>
        </TabsList>
        <TabsContent value="my-profile">
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
          <form onSubmit={save} className="flex flex-col gap-4">
            <DoctorDetailsFields value={f} onChange={setForm} emailDisabled showAdminPortalRequest={false} />
            {dirty && <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => seed(doctorDetails({ ...data, mobile: data.mobile ?? user?.mobile ?? "" }))}>Cancel</Button>
              <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save changes"}</Button>
            </div>}
          </form>
        </CardContent>
      </Card>
        </TabsContent>
        <TabsContent value="my-clinic" className="space-y-4">
          <ClinicProfile />

        </TabsContent>
      </Tabs>
    </div>
  );
}
