import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  FileKey,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Pin,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Terminal,
  Upload,
  Users,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Navigate, Tone } from "../types";
import { evidenceItems, logRows, phaseRows, scoreRows } from "../data/aftermath";
import { logSeverityClass, toneBg, toneBorder, toneText } from "../lib/tone";
import { Footer } from "../components/layout/Footer";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

const amber = "text-[#F2A93B]";
const amberBorder = "border-[#F2A93B]/30";
const amberBg = "bg-[#F2A93B]/8";

const comparisonRows = [
  ["Data completeness", "Clean, complete, obvious", "Fragmented, noisy, contradictory"],
  ["Cognitive load", "Single-alert focus", "Multi-source correlation under time pressure"],
  ["False positives", "Rarely trained", "Daily operational reality"],
  ["Hypothesis defense", "Find the right answer", "Defend the assessment to stakeholders"],
  ["Scenario scalability", "Static lab catalog", "Fresh content from structured threat intel"],
];

const studioStates = [
  "draft",
  "pending_ai_review",
  "needs_revision",
  "pending_human_review",
  "approved",
  "published",
];

const threatSources = [
  ["NVD CVE API", "CVE metadata, CVSS, references, CPE applicability", "24h"],
  ["MITRE ATT&CK TAXII", "Tactics, techniques, procedures, detection guidance", "7d"],
  ["CISA KEV", "Known exploited vulnerabilities and due dates", "6h"],
  ["FIRST EPSS", "Exploit probability scores and percentiles", "24h"],
];

const safetyRules = [
  {
    title: "Allowed",
    body: "Synthetic logs, fictional companies, RFC1918 or documentation IP ranges, and normal cybersecurity vocabulary.",
    tone: "leaf" as const,
  },
  {
    title: "Blocked",
    body: "Real victim names, public target IPs, credentials, exploit commands, malware code, and destructive instructions.",
    tone: "danger" as const,
  },
  {
    title: "Review principle",
    body: "The system may describe attacks for analyst training, but generated content must not become operational instruction.",
    tone: "amber" as const,
  },
];

const roadmapRows = [
  ["M1", "Core simulator", "FastAPI scaffold, deterministic log synthesis, SQLite session store."],
  ["M2", "Investigation UI", "Workbench, evidence board, timer, report form, debrief screens."],
  ["M3", "AI adversary", "Devil's-advocate challenge, grading engine, hints, score visualization."],
  ["M5", "Scenario Studio", "Threat-intel integration, scenario generation, safety and quality review."],
];

function useRollingRows<T>(items: T[], intervalMs: number, limit: number) {
  const [visibleRows, setVisibleRows] = useState<T[]>(() => items.slice(0, Math.min(limit, 5)));

  useEffect(() => {
    let index = Math.min(limit, 5);
    const timer = window.setInterval(() => {
      setVisibleRows((current) => {
        const next = [...current, items[index % items.length]];
        index += 1;
        return next.slice(Math.max(0, next.length - limit));
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, items, limit]);

  return visibleRows;
}

function useCycleIndex(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, length]);

  return index;
}

export function HomePage({ navigate }: { navigate: Navigate }) {
  return (
    <>
      <div className="border-b border-line bg-panel/72">
        <div className="mx-auto flex w-[calc(100%_-_2rem)] max-w-[1440px] items-center gap-2 overflow-hidden py-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#F2A93B] soft-pulse" />
          <span className="whitespace-nowrap">Case #SOC-2026-0447</span>
          <span className="text-line2">/</span>
          <span className="whitespace-nowrap">status: investigation open</span>
          <span className="text-line2">/</span>
          <span className="whitespace-nowrap">evidence items: {evidenceItems.length}</span>
        </div>
      </div>

      <main className="page-in">
        <section className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10">
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="grid gap-5">
              <Panel className="p-6">
                <div className={`inline-flex items-center gap-2 rounded border ${amberBorder} ${amberBg} px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] ${amber}`}>
                  <Radio size={13} /> Adversarial SOC training platform
                </div>
                <h1 className="mt-6 max-w-3xl text-balance text-3xl font-black leading-tight text-text sm:text-4xl lg:text-5xl">
                  The logs will not tell you what happened. The analyst has to argue for it.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-sky-100/74 sm:text-base">
                  CyberRange AI is a portable SOC training platform for hypothesis construction, evidence defense, and uncertainty management. It combines a timed investigation simulator with an AI-assisted Scenario Studio for safe, reviewable scenario generation.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <SolidButton onClick={() => navigate("scenarios")} icon={Play} className="min-h-10 bg-[#F2A93B] px-4 text-void shadow-none hover:bg-[#ffbf5c]">
                    Start Investigation
                  </SolidButton>
                  <GhostButton onClick={() => navigate("studio")} icon={WandSparkles} className="min-h-10 px-4">
                    Scenario Studio
                  </GhostButton>
                  <GhostButton onClick={() => navigate("workspace")} icon={Terminal} className="min-h-10 px-4">
                    Workbench
                  </GhostButton>
                </div>
              </Panel>

              <LiveLogPanel />
            </div>

            <EvidenceDossier navigate={navigate} />
          </div>
        </section>

        <section className="border-y border-line bg-void/60">
          <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10 lg:grid-cols-[0.72fr_1.28fr]">
            <SectionIntro
              tag="Exhibit A"
              title="Traditional labs hide the hard parts of SOC work."
              copy="The platform is designed around the gap between clean training exercises and the ambiguity of real incident response."
            />
            <Panel className="overflow-hidden">
              <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-panel2/45 px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                <span>Deficiency</span>
                <span>Traditional training</span>
                <span>Real SOC work</span>
              </div>
              {comparisonRows.map(([label, traditional, real], index) => (
                <div key={label} className={`grid gap-3 border-t border-line px-5 py-3 text-sm md:grid-cols-[0.8fr_1fr_1fr] ${index % 2 ? "bg-void/45" : "bg-panel/30"}`}>
                  <strong>{label}</strong>
                  <span className="text-muted line-through decoration-line2">{traditional}</span>
                  <span className={amber}>{real}</span>
                </div>
              ))}
            </Panel>
          </div>
        </section>

        <section className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="overflow-hidden">
            <div className="border-b border-line bg-panel2/35 px-5 py-4">
              <PanelHeading icon={Boxes} title="Scenario Studio" subtitle="generation with review gates" />
            </div>
            <div className="grid gap-0">
              <StudioFeature icon={WandSparkles} title="Generate from threat data" body="Draft scenario configs from CVE, MITRE ATT&CK, CISA KEV, and EPSS patterns without copying real victims or incidents." />
              <StudioFeature icon={Upload} title="Submit custom scenario JSON" body="Uploaded configs are validated against schema, safety rules, evidence sufficiency, and difficulty calibration." bordered />
              <StudioFeature icon={GitBranch} title="Never publish directly" body="All content moves through draft, AI review, revision, human review, approval, and publication states." bordered />
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-line bg-panel2/35 px-5 py-4">
              <PanelHeading icon={Database} title="Threat intelligence sources" subtitle="public structured data" />
            </div>
            {threatSources.map(([name, data, cache], index) => (
              <div key={name} className={`grid gap-3 px-5 py-4 text-sm md:grid-cols-[10rem_1fr_4rem] ${index > 0 ? "border-t border-line" : ""}`}>
                <strong>{name}</strong>
                <span className="leading-6 text-sky-100/72">{data}</span>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{cache}</span>
              </div>
            ))}
          </Panel>
        </section>

        <section className="border-y border-line bg-panel/32">
          <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10 lg:grid-cols-[0.72fr_1.28fr]">
            <SectionIntro
              tag="Review pipeline"
              title="Generated content is treated as a draft, not as truth."
              copy="AI assistance makes scenario creation scalable, but safety and quality controls are explicit parts of the product."
            />
            <div className="grid gap-5">
              <PipelineStrip />
              <div className="grid gap-4 md:grid-cols-3">
                {safetyRules.map((rule) => (
                  <Panel key={rule.title} className={`p-5 ${toneBorder(rule.tone)} ${toneBg(rule.tone)}`}>
                    <strong className={toneText(rule.tone)}>{rule.title}</strong>
                    <p className="mt-3 text-sm leading-6 text-sky-100/75">{rule.body}</p>
                  </Panel>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10 xl:grid-cols-[1fr_1fr]">
          <Panel className="overflow-hidden">
            <div className="border-b border-line bg-panel2/35 px-5 py-4">
              <PanelHeading icon={GitBranch} title="Investigation loop" subtitle="how the trainee progresses" />
            </div>
            {phaseRows.map(([number, label, time, copy, tone]) => (
              <PhaseRow key={number} number={number} label={label} time={time} copy={copy} tone={tone} />
            ))}
          </Panel>

          <div className="grid gap-5">
            <Panel className="p-5">
              <PanelHeading icon={BadgeCheck} title="Grading dimensions" subtitle="evidence-backed assessment" />
              <div className="mt-5 grid gap-3">
                {scoreRows.map((row) => (
                  <ScoreMetric key={row.label} row={row} />
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <PanelHeading icon={BookOpenText} title="Technical project framing" subtitle="academic proposal v2.0" />
              <p className="mt-4 text-sm leading-6 text-sky-100/74">
                The thesis-aligned scope asks whether LLMs can generate safe, fair SOC training scenarios from structured threat intelligence, and whether adversarial feedback improves reasoning quality.
              </p>
            </Panel>
          </div>
        </section>

        <section className="border-y border-line bg-void/60">
          <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-10 lg:grid-cols-[0.72fr_1.28fr]">
            <SectionIntro
              tag="Roadmap"
              title="A build plan that matches the proposal."
              copy="The current prototype covers the simulator shell and static Scenario Studio surfaces. The next useful work is connecting review and generation services."
            />
            <Panel className="overflow-hidden">
              {roadmapRows.map(([id, title, body], index) => (
                <div key={id} className={`grid gap-3 px-5 py-4 md:grid-cols-[4rem_12rem_1fr] ${index > 0 ? "border-t border-line" : ""}`}>
                  <span className={`font-mono text-sm font-black ${amber}`}>{id}</span>
                  <strong>{title}</strong>
                  <span className="text-sm leading-6 text-sky-100/72">{body}</span>
                </div>
              ))}
            </Panel>
          </div>
        </section>

        <section className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-5 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <SectionTag>Current prototype</SectionTag>
            <h2 className="mt-3 text-2xl font-black">Continue with SSH Reconnaissance.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/72">
              The active prototype demonstrates the investigation workflow: log inspection, evidence marking, report drafting, and debrief scoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => navigate("scenarios")} icon={FileKey} className="min-h-10 px-4">
              Case Library
            </GhostButton>
            <SolidButton onClick={() => navigate("workspace")} icon={ArrowRight} className="min-h-10 bg-[#F2A93B] px-4 text-void shadow-none hover:bg-[#ffbf5c]">
              Open Case
            </SolidButton>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SectionTag({ children }: { children: string }) {
  return <div className={`font-mono text-[0.68rem] uppercase tracking-[0.2em] ${amber}`}>{children}</div>;
}

function SectionIntro({ tag, title, copy }: { tag: string; title: string; copy: string }) {
  return (
    <div>
      <SectionTag>{tag}</SectionTag>
      <h2 className="mt-3 max-w-xl text-2xl font-black leading-tight sm:text-3xl">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-sky-100/72">{copy}</p>
    </div>
  );
}

function LiveLogPanel() {
  const visibleRows = useRollingRows(logRows, 1200, 8);

  return (
    <Panel className="scan-sweep overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-panel2/45 px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <Terminal size={14} className={amber} />
          auth.log - live tail
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger/70" />
          <span className="h-2 w-2 rounded-full bg-[#F2A93B]/70" />
          <span className="h-2 w-2 rounded-full bg-cyan/70" />
        </div>
      </div>
      <div className="grid gap-1 overflow-x-auto p-4 font-mono text-sm">
        {visibleRows.map((row, index) => (
          <div
            key={row.id}
            className={`rise grid min-w-[720px] grid-cols-[3rem_5.5rem_8rem_minmax(0,1fr)] gap-4 border-l-2 px-3 py-2 ${logSeverityClass(row.severity)}`}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <span className="text-slate-500">{row.id}</span>
            <span className="text-slate-500">{row.time}</span>
            <span className={row.severity === "warn" ? amber : row.severity === "critical" ? "text-danger" : "text-cyan"}>{row.source}</span>
            <span className="truncate">{row.text}</span>
          </div>
        ))}
        <span className="ml-16 mt-1 inline-block h-4 w-1.5 bg-[#F2A93B] blink-cursor" />
      </div>
    </Panel>
  );
}

function EvidenceDossier({ navigate }: { navigate: Navigate }) {
  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <PanelHeading icon={Fingerprint} title="Evidence board" subtitle="current case dossier" />
        <Status tone="amber">{evidenceItems.length} marked</Status>
      </div>
      <div className="grid gap-3">
        {evidenceItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate("evidence")}
            className="rise border-l-2 border-[#F2A93B]/65 bg-void/65 px-4 py-3 text-left transition hover:bg-panel2/55"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">{item.title}</strong>
              <span className="font-mono text-[0.68rem] text-muted">{item.id}</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-5 text-sky-100/75">{item.content}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.slice(0, 2).map((tag) => (
                <span key={tag.label} className={`rounded border px-2 py-1 font-mono text-[0.65rem] ${toneBorder(tag.tone)} ${toneBg(tag.tone)} ${toneText(tag.tone)}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-dashed border-line2 p-4">
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">Review state</div>
        <div className={`mt-3 inline-flex rotate-[-2deg] rounded border-2 ${amberBorder} px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.2em] ${amber}`}>
          pending human review
        </div>
        <p className="mt-4 text-sm leading-6 text-sky-100/70">
          AI confidence 0.92. Safety check passed. Reviewer approval required before publication.
        </p>
      </div>
    </Panel>
  );
}

function StudioFeature({
  icon: Icon,
  title,
  body,
  bordered = false,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  bordered?: boolean;
}) {
  return (
    <div className={`grid grid-cols-[2.4rem_1fr] gap-3 px-5 py-4 ${bordered ? "border-t border-line" : ""}`}>
      <span className="grid h-9 w-9 place-items-center rounded-md border border-line2 bg-void/65 text-[#F2A93B]">
        <Icon size={17} />
      </span>
      <span>
        <strong>{title}</strong>
        <span className="mt-1 block text-sm leading-6 text-sky-100/72">{body}</span>
      </span>
    </div>
  );
}

function PipelineStrip() {
  const activeIndex = useCycleIndex(studioStates.length, 1800);

  return (
    <Panel className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-6">
        {studioStates.map((state, index) => (
          <div
            key={state}
            className={`min-h-24 border-line p-4 transition-colors ${index === activeIndex ? "review-active" : ""} ${index > 0 ? "border-t md:border-l md:border-t-0" : ""}`}
          >
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">0{index + 1}</div>
            <div className={`mt-3 text-sm font-black ${state === "needs_revision" ? "text-danger" : state === "published" ? "text-leaf" : amber}`}>
              {state.replaceAll("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ScoreMetric({ row }: { row: { label: string; value: number; max: number; tone: Tone } }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{row.label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-line">
        <span
          className={`block h-full rounded-full ${row.tone === "amber" ? "bg-amber" : row.tone === "violet" ? "bg-violet" : row.tone === "leaf" ? "bg-leaf" : "bg-cyan"}`}
          style={{ width: `${(row.value / row.max) * 100}%` }}
        />
      </span>
      <strong className={`text-right font-mono ${toneText(row.tone)}`}>{row.value}</strong>
    </div>
  );
}

function PhaseRow({
  number,
  label,
  time,
  copy,
  tone,
}: {
  number: string;
  label: string;
  time: string;
  copy: string;
  tone: Tone;
}) {
  return (
    <div className="grid gap-4 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[4rem_8rem_1fr] md:items-center">
      <span className={`font-mono text-lg font-black ${tone === "amber" ? amber : toneText(tone)}`}>{number}</span>
      <span>
        <span className={`block font-mono text-xs font-black uppercase tracking-[0.18em] ${tone === "amber" ? amber : toneText(tone)}`}>{label}</span>
        <span className="mt-1 block text-sm text-muted">{time}</span>
      </span>
      <span className="text-sm leading-6 text-sky-100/75">{copy}</span>
    </div>
  );
}
