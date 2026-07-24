import type { LucideIcon } from "lucide-react";

export type Page =
  | "home"
  | "login"
  | "signup"
  | "scenarios"
  | "briefing"
  | "workspace"
  | "evidence"
  | "report"
  | "debrief"
  | "studio";

export type Navigate = (page: Page) => void;

export type Tone = "cyan" | "amber" | "danger" | "violet" | "leaf" | "muted";

export type NavItem = {
  id: Page;
  label: string;
  icon: LucideIcon;
};

export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  status: "New" | "In Progress" | "Completed" | "Locked";
  mode: "Practice" | "Timed" | "Exam";
  attack: string;
  duration: string;
  progress: number;
  icon: LucideIcon;
  summary: string;
};

export type LogRow = {
  id: string;
  time: string;
  source: string;
  text: string;
  severity: "info" | "warn" | "critical" | "muted";
};

export type EvidenceItem = {
  id: string;
  title: string;
  tactic: string;
  source: string;
  line: number;
  time: string;
  content: string;
  note: string;
  confidence: number;
  tags: Array<{ label: string; tone: Tone }>;
  tone: Tone;
};

export type ScoreRow = {
  label: string;
  value: number;
  max: number;
  tone: Tone;
};
