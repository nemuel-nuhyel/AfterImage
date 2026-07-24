import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Kicker({
  children,
  icon: Icon,
  className = "",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.28em] text-cyan ${className}`}>
      {Icon && <Icon size={15} />}
      <span>{children}</span>
    </div>
  );
}
