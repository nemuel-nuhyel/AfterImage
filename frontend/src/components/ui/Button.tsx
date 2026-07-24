import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ButtonProps = {
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function SolidButton({
  children,
  icon: Icon,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan px-5 text-sm font-black text-void shadow-[0_10px_26px_rgba(38,207,194,0.22)] transition hover:bg-cyan2 focus-visible:app-focus ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  icon: Icon,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line2 bg-void/45 px-5 text-sm font-black text-text transition hover:border-cyan/45 hover:bg-cyan/8 focus-visible:app-focus ${className}`}
    >
      {Icon && <Icon size={18} className="text-cyan" />}
      {children}
    </button>
  );
}
