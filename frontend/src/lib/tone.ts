import type { Tone } from "../types";

export function toneText(tone: Tone | string) {
  if (tone === "danger") return "text-danger";
  if (tone === "amber") return "text-amber";
  if (tone === "violet") return "text-violet";
  if (tone === "leaf") return "text-leaf";
  if (tone === "muted") return "text-muted";
  return "text-cyan";
}

export function toneBg(tone: Tone | string) {
  if (tone === "danger") return "bg-danger/10";
  if (tone === "amber") return "bg-amber/10";
  if (tone === "violet") return "bg-violet/10";
  if (tone === "leaf") return "bg-leaf/10";
  if (tone === "muted") return "bg-muted/10";
  return "bg-cyan/10";
}

export function toneBorder(tone: Tone | string) {
  if (tone === "danger") return "border-danger/35";
  if (tone === "amber") return "border-amber/35";
  if (tone === "violet") return "border-violet/35";
  if (tone === "leaf") return "border-leaf/35";
  if (tone === "muted") return "border-muted/25";
  return "border-cyan/35";
}

export function toneDot(tone: Tone | string) {
  if (tone === "danger") return "bg-danger";
  if (tone === "amber") return "bg-amber";
  if (tone === "violet") return "bg-violet";
  if (tone === "leaf") return "bg-leaf";
  if (tone === "muted") return "bg-muted";
  return "bg-cyan";
}

export function logSeverityClass(severity: string) {
  if (severity === "critical") return "border-danger bg-danger/10 text-red-100";
  if (severity === "warn") return "border-amber/40 text-amber";
  if (severity === "muted") return "border-transparent text-slate-500";
  return "border-transparent text-sky-100/85";
}
