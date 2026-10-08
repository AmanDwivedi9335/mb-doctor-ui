import { Link } from "react-router-dom";
import { Search, ClipboardList, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Faqs } from "@/pages/settings/Faqs";

const TIPS = [
  { icon: Search, title: "Find a patient", body: "Use Home in the Consultation menu. Enter the patient's 13-character MID to open their record." },
  { icon: ClipboardList, title: "Record care", body: "Once a patient is open, add diagnoses, procedures, reports, and follow-ups from the tabs." },
  { icon: Receipt, title: "Run your clinic", body: "Manage appointments, billing, and staff under Clinic Management. Manage your subscription in Settings." },
];

export function Help() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold">Help &amp; Tutorial</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Get started and find your way around MediBank for Doctors.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIPS.map((t) => (
          <Card key={t.title}>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <div className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <t.icon className="size-4" />
              </div>
              <CardTitle className="text-[14px]">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[13px] leading-relaxed text-muted-foreground">{t.body}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Faqs />
          <p className="mt-4 text-sm text-muted-foreground">Need more help? <Link to="/settings/contact" className="font-medium text-primary hover:underline">Contact us</Link>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
