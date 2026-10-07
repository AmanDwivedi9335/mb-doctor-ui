import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * A field always has a label. Not optional: an unlabeled control drifts out of
 * alignment in a grid row and leaves the reader guessing. The house rule from
 * the patient app carries over here (FormKit label REQUIRED).
 */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  className,
  id,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id || React.useId();
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} className={className}>
      <Input id={fieldId} {...props} />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  id,
  ...props
}: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id || React.useId();
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} className={className}>
      <Textarea id={fieldId} {...props} />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  className,
  value,
  onValueChange,
  placeholder,
  options,
}: {
  label: string;
  hint?: string;
  className?: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  options: readonly string[] | { value: string; label: string }[];
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <Field label={label} hint={hint} className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
