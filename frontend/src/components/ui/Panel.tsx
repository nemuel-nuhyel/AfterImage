import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-panel/88 shadow-[0_18px_55px_rgba(0,0,0,0.24)] ${className}`}>
      {children}
    </div>
  );
}

export function PanelHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md border border-line2 bg-void/65 text-cyan">
          <Icon size={17} />
        </span>
        <span>
          <strong className="block text-sm font-black">{title}</strong>
          {subtitle && <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">{subtitle}</span>}
        </span>
      </div>
      {action}
    </div>
  );
}
