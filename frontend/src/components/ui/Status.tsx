import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "../../types";
import { toneBg, toneBorder, toneText } from "../../lib/tone";

export function Status({
  tone,
  icon: Icon,
  children,
  className = "",
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-h-7 items-center gap-2 rounded-md border px-2.5 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] ${toneBorder(tone)} ${toneBg(tone)} ${toneText(tone)} ${className}`}>
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}
