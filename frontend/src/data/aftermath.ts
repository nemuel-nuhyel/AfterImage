import {
  Activity,
  BadgeCheck,
  Clock3,
  Database,
  FileKey,
  Gauge,
  GitBranch,
  Layers3,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { EvidenceItem, LogRow, ScoreRow, Scenario } from "../types";

export const scenario: Scenario = {
  id: "CASE-SSH-RE",
  title: "SSH Reconnaissance",
  subtitle: "case://ssh-recon - timed mode",
  difficulty: "Beginner",
  status: "In Progress",
  mode: "Timed",
  attack: "Initial Access",
  duration: "60 min",
  progress: 58,
  icon: Server,
  summary:
    "A junior analyst notices unusual activity on the development server after repeated SSH failures.",
};

export const scenarios: Scenario[] = [
  scenario,
  {
    id: "CASE-PHISH",
    title: "Phishing Pivot",
    subtitle: "case://finance-ws - practice",
    difficulty: "Intermediate",
    status: "New",
    mode: "Practice",
    attack: "Credential Access",
    duration: "45 min",
    progress: 0,
    icon: GitBranch,
    summary: "A finance workstation beacons to unknown hosts after a suspicious mailbox rule.",
  },
  {
    id: "CASE-PRIV-E",
    title: "Silent Escalation",
    subtitle: "case://db-prod - exam",
    difficulty: "Advanced",
    status: "Locked",
    mode: "Exam",
    attack: "Privilege Escalation",
    duration: "90 min",
    progress: 0,
    icon: Zap,
    summary: "Routine maintenance hides a privilege escalation path on a domain controller.",
  },
  {
    id: "CASE-CLOUD-T",
    title: "Suspicious Cloud Token",
    subtitle: "case://cloud-idp - timed",
    difficulty: "Intermediate",
    status: "Completed",
    mode: "Timed",
    attack: "Exfiltration",
    duration: "50 min",
    progress: 100,
    icon: Layers3,
    summary: "A service token appears in a location it should never reach.",
  },
];

export const objectives = [
  "Identify brute-force SSH patterns",
  "Distinguish failed vs successful authentication",
  "Recognize red herrings",
  "Find evidence of successful compromise hidden in noise",
];

export const logRows: LogRow[] = [
  {
    id: "001",
    time: "02:14:07",
    source: "sshd[2241]",
    text: "Connection from 203.0.113.44 port 51204 on dev-server ssh2",
    severity: "info",
  },
  {
    id: "002",
    time: "02:14:08",
    source: "sshd[2241]",
    text: "Failed password for root from 203.0.113.44 port 51208 ssh2",
    severity: "warn",
  },
  {
    id: "003",
    time: "02:14:09",
    source: "sshd[2241]",
    text: "Failed password for root from 203.0.113.44 port 51211 ssh2",
    severity: "warn",
  },
  {
    id: "004",
    time: "02:14:10",
    source: "sshd[2241]",
    text: "Failed password for admin from 203.0.113.44 port 51214 ssh2",
    severity: "warn",
  },
  {
    id: "005",
    time: "02:14:11",
    source: "sshd[2241]",
    text: "Failed password for admin from 203.0.113.44 port 51218 ssh2",
    severity: "warn",
  },
  {
    id: "006",
    time: "02:14:13",
    source: "sshd[2241]",
    text: "Failed password for deploy from 203.0.113.44 port 51224 ssh2",
    severity: "warn",
  },
  {
    id: "007",
    time: "02:14:55",
    source: "sshd[2249]",
    text: "Failed password for deploy from 203.0.113.44 port 51231 ssh2",
    severity: "warn",
  },
  {
    id: "008",
    time: "02:15:02",
    source: "sshd[2249]",
    text: "pam_unix(sshd:auth): 41 failures; possible brute force window",
    severity: "warn",
  },
  {
    id: "009",
    time: "02:15:48",
    source: "sshd[2261]",
    text: "Accepted password for deploy from 203.0.113.44 port 51204 ssh2",
    severity: "critical",
  },
  {
    id: "010",
    time: "02:15:48",
    source: "sshd[2261]",
    text: "pam_unix(sshd:session): session opened for user deploy by uid=0",
    severity: "critical",
  },
  {
    id: "011",
    time: "02:16:03",
    source: "sudo",
    text: "deploy : TTY=pts/0 ; PWD=/home/deploy ; COMMAND=/usr/bin/cat /etc/shadow",
    severity: "critical",
  },
  {
    id: "012",
    time: "02:16:31",
    source: "sshd[2261]",
    text: "subsystem request for sftp by user deploy",
    severity: "warn",
  },
  {
    id: "013",
    time: "03:02:11",
    source: "sshd[2410]",
    text: "Accepted publickey for j.reyes from 10.10.4.12 port 42192 ssh2",
    severity: "muted",
  },
  {
    id: "014",
    time: "03:18:44",
    source: "CRON[2510]",
    text: "pam_unix(cron:session): session closed for user root",
    severity: "muted",
  },
];

export const evidenceItems: EvidenceItem[] = [
  {
    id: "EV-009",
    title: "Successful hostile login",
    tactic: "Initial Access",
    source: "auth.log",
    line: 9,
    time: "02:15:48",
    content: "Accepted password for deploy from 203.0.113.44 port 51204",
    note: "Successful login from the same IP after 41 failures. This turns the brute-force activity into a likely account compromise.",
    confidence: 5,
    tone: "cyan",
    tags: [
      { label: "ip 203.0.113.44", tone: "danger" },
      { label: "user deploy", tone: "amber" },
      { label: "sshd", tone: "cyan" },
    ],
  },
  {
    id: "EV-011",
    title: "Credential file access",
    tactic: "Credential Access",
    source: "audit.log",
    line: 11,
    time: "02:16:03",
    content: "deploy executed cat /etc/shadow through sudo",
    note: "Credential access follows the accepted SSH event within 15 seconds, supporting impact and response urgency.",
    confidence: 4,
    tone: "danger",
    tags: [
      { label: "sudo", tone: "danger" },
      { label: "/etc/shadow", tone: "violet" },
    ],
  },
  {
    id: "EV-087",
    title: "Firewall allowed SSH",
    tactic: "Network Corroboration",
    source: "firewall.log",
    line: 87,
    time: "02:15:48",
    content: "ALLOW TCP 203.0.113.44:51204 -> dev-server:22",
    note: "Network evidence confirms the inbound SSH flow at the same timestamp as the accepted auth event.",
    confidence: 4,
    tone: "amber",
    tags: [
      { label: "tcp/22", tone: "cyan" },
      { label: "dev-server", tone: "leaf" },
    ],
  },
];

export const features = [
  {
    icon: Database,
    title: "Realistic log investigations",
    copy: "Parse auth, audit, firewall, EDR, and proxy evidence sourced from incident retros.",
    id: "F01",
    tone: "cyan" as const,
  },
  {
    icon: FileKey,
    title: "Evidence-based reporting",
    copy: "Pin log lines, map findings to ATT&CK, and assemble a defensible incident report.",
    id: "F02",
    tone: "violet" as const,
  },
  {
    icon: Clock3,
    title: "Timed analyst scenarios",
    copy: "Run pressure drills that mirror real SOC triage, hunt, report, and debrief work.",
    id: "F03",
    tone: "amber" as const,
  },
  {
    icon: ShieldCheck,
    title: "Scoring and debriefs",
    copy: "Review accuracy, attribution, containment, and communication with calibrated feedback.",
    id: "F04",
    tone: "leaf" as const,
  },
];

export const phaseRows = [
  ["01", "TRIAGE", "00:05", "Open the alert. Skim auth.log, audit.d, and firewall evidence.", "cyan"],
  ["02", "HYPOTHESIS", "00:10", "Form an initial theory of access, persistence, and intent.", "violet"],
  ["03", "HUNT", "00:35", "Pivot across hosts, pin evidence, and map ATT&CK techniques.", "amber"],
  ["04", "REPORT", "00:50", "Draft INC-####. Cite log lines. Recommend actions.", "leaf"],
  ["05", "DEBRIEF", "01:00", "Submit, compare against ground truth, and review misses.", "danger"],
] as const;

export const scoreRows: ScoreRow[] = [
  { label: "Accuracy", value: 92, max: 100, tone: "leaf" },
  { label: "Attribution", value: 84, max: 100, tone: "cyan" },
  { label: "Containment", value: 78, max: 100, tone: "amber" },
  { label: "Comms", value: 95, max: 100, tone: "violet" },
];

export const briefingFacts = [
  { icon: Clock3, label: "Window", value: "60 minutes" },
  { icon: Gauge, label: "Mode", value: "Timed" },
  { icon: Database, label: "Artifacts", value: "auth, audit, firewall" },
  { icon: Activity, label: "Target score", value: "87 / 100" },
  { icon: BadgeCheck, label: "Rubric", value: "Evidence-first" },
];
