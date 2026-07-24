import { CheckCircle2, Play, Radar } from "lucide-react";
import type { Navigate } from "../types";
import { briefingFacts, objectives, scenario } from "../data/aftermath";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { SolidButton } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

export function ScenarioBriefingPage({ navigate }: { navigate: Navigate }) {
  return (
    <PageFrame>
      <PageHeader
        kicker="Mission Briefing"
        title={scenario.title}
        copy={scenario.summary}
        action={<SolidButton onClick={() => navigate("workspace")} icon={Play}>Initialize Session</SolidButton>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-panel2/60 px-6 py-4 font-mono text-xs uppercase tracking-[0.28em] text-muted">
            <span>Classified training file</span>
            <span className="text-cyan">AFM-SOC-001</span>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {briefingFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-md border border-line bg-void/65 p-4">
                  <Icon size={17} className="text-cyan" />
                  <span className="mt-4 block text-xs text-muted">{label}</span>
                  <strong className="mt-1 block">{value}</strong>
                </div>
              ))}
            </div>

            <h2 className="mt-10 text-2xl font-black">Objectives</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {objectives.map((objective) => (
                <div key={objective} className="flex gap-3 rounded-md border border-line bg-void/65 p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-leaf" />
                  <span className="text-sky-100/85">{objective}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded border border-cyan/30 bg-cyan/10 text-cyan">
              <Radar size={18} />
            </span>
            <div>
              <strong>Session posture</strong>
              <p className="font-mono text-xs text-muted">Hints 2/3 - timed mode</p>
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            {["Practice", "Timed", "Exam"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-md border px-4 py-3 text-left font-bold ${
                  mode === "Timed" ? "border-cyan/40 bg-cyan/12 text-cyan" : "border-line bg-void/60 text-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="mt-8 rounded-md border border-amber/25 bg-amber/10 p-4">
            <Status tone="amber">Operator note</Status>
            <p className="mt-4 text-sm leading-6 text-sky-100/75">
              Evidence must support attack success, affected identity, impact, and immediate
              response. Red herrings are present in later admin activity.
            </p>
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}
