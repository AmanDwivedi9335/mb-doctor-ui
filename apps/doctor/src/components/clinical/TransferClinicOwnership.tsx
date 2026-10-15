import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/DoctorAuthContext";
import type { DoctorUser } from "@/types";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

export function TransferClinicOwnership({
  clinicId,
  clinicName,
}: {
  clinicId: string;
  clinicName: string;
}) {
  const { user, refreshSession } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["doctor", "registered-doctors"],
    queryFn: () => api.get<{ doctors: DoctorUser[] }>("/registered-doctors"),
    enabled: open,
  });
  const doctors =
    data?.doctors.filter(
      (d) =>
        d.id !== user?.id &&
        `${d.name} ${d.email} ${d.doctorNo ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    ) ?? [];
  const transfer = useMutation({
    mutationFn: () =>
      api.post(`/clinics/${clinicId}/transfer-ownership`, {
        doctorId: selected,
      }),
    onSuccess: async () => {
      setOpen(false);
      setSelected("");
      await refreshSession();
      await qc.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Clinic ownership transferred.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setSelected("");
          setSearch("");
          setOpen(true);
        }}
      >
        Transfer ownership
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => !transfer.isPending && setOpen(value)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer ownership of {clinicName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Select a registered doctor as the new principal. You will remain
            linked as a member and can remove yourself afterward. Clinic records
            and appointments remain with the clinic.
          </p>
          <TextField
            label="Search registered doctors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected("");
            }}
            placeholder="Name, email or doctor ID"
          />
          <div
            className="max-h-64 overflow-y-auto space-y-2"
            role="group"
            aria-label="Registered doctors"
          >
            {doctors.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
              >
                <input
                  type="radio"
                  name={`new-owner-${clinicId}`}
                  value={d.id}
                  checked={selected === d.id}
                  onChange={() => setSelected(d.id)}
                />
                <span className="text-sm">
                  <span className="block font-medium">{d.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {d.email}
                    {d.doctorNo ? ` · ${d.doctorNo}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {isLoading && <p className="text-sm">Loading registered doctors…</p>}
          {error && <p role="alert">Could not load registered doctors.</p>}
          {data && !doctors.length && (
            <p className="text-sm">No matching registered doctors.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={transfer.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selected || transfer.isPending}
              onClick={() => transfer.mutate()}
            >
              {transfer.isPending ? "Transferring…" : "Confirm transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
