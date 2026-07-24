import type { LucideIcon } from "lucide-react";
import { Check, Eye } from "lucide-react";
import type { ReactNode } from "react";

export function Field({
  label,
  icon: Icon,
  value,
  type = "text",
  action,
  inputValue,
  onValueChange,
  autoComplete,
  required,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  type?: string;
  action?: string;
  inputValue?: string;
  onValueChange?: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-3">
      <span className="flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
        {label}
        {action && <span>{action}</span>}
      </span>
      <span className="flex min-h-[50px] items-center gap-3 rounded-md border border-line2 bg-void/70 px-4 text-sky-100/80 transition focus-within:border-cyan/55">
        <Icon size={18} className="text-muted" />
        <input
          type={type}
          value={inputValue}
          defaultValue={inputValue === undefined && type !== "password" ? value : undefined}
          placeholder={type === "password" ? value : undefined}
          onChange={(event) => onValueChange?.(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-sky-100/78"
        />
        {type === "password" && <Eye size={17} className="text-muted" />}
      </span>
    </label>
  );
}

export function CheckLabel({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm text-sky-100/80">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-cyan/40 bg-cyan/10 text-cyan">
        <Check size={14} />
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 font-mono text-[0.68rem] uppercase tracking-[0.34em] text-muted">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
