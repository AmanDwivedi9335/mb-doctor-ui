import { Toaster as Sonner } from "sonner";

/** App toaster. Plain, top-right, no theme gymnastics. */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-md border border-border bg-background text-foreground text-sm shadow-md",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export { toast } from "sonner";
