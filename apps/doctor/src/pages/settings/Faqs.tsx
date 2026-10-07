import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFaqs } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Faqs() {
  const { data, isLoading } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-lg border bg-card">
      {(data?.faqs ?? []).map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} className="border-b last:border-b-0">
            <button
              onClick={() => setOpenId(open ? null : faq.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-secondary/50"
            >
              <span className="text-sm font-medium">{faq.question}</span>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>
            {open && <div className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{faq.answer}</div>}
          </div>
        );
      })}
    </div>
  );
}
