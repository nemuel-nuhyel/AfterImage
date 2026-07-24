import { AlertTriangle, ArrowRight, BadgeCheck, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import type { Navigate, ScoreRow } from "../types";
import { evidenceItems, scoreRows } from "../data/aftermath";
import { toneText } from "../lib/tone";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

export function DebriefPage({ navigate }: { navigate: Navigate }) {
  const total = Math.round(scoreRows.reduce((sum, row) => sum + row.value, 0) / scoreRows.length);

  return (
    <PageFrame>
      <PageHeader
        kicker="Score Debrief"
        title="Incident package reviewed"
        copy="The submitted report identified the successful SSH compromise and supported it with log evidence. Review scoring, misses, and next actions."
        action={<SolidButton onClick={() => navigate("scenarios")} icon={ArrowRight}>Next Scenario</SolidButton>}
      />

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
        <Panel className="grid justify-items-center p-6 text-center">
          <div className="grid h-32 w-32 place-items-center rounded-lg border border-cyan/35 bg-cyan/10">
            <span className="font-mono text-4xl font-black text-cyan">{total}</span>
          </div>
          <h2 className="mt-6 text-2xl font-black">Overall score</h2>
          <p className="mt-4 leading-7 text-sky-100/72">
            Strong detection with a clear evidence trail. Improve response specificity around account recovery.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Status tone="leaf" icon={BadgeCheck}>Passed</Status>
            <Status tone="cyan">Scenario 1</Status>
          </div>
        </Panel>

        <Panel className="p-6">
          <PanelHeading icon={BarChart3} title="Breakdown" subtitle="calibrated rubric" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {scoreRows.map((row) => (
              <ScoreMetric key={row.label} row={row} />
            ))}
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {[
              ["Caught hostile SSH success after brute-force window", true],
              ["Cited credential access impact", true],
              ["Missed exact firewall correlation in primary narrative", false],
              ["No isolation owner in containment plan", false],
            ].map(([text, ok]) => (
              <div key={String(text)} className="flex items-center gap-3 text-sm text-sky-100/78">
                {ok ? <CheckCircle2 size={17} className="text-leaf" /> : <XCircle size={17} className="text-danger" />}
                {text}
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel className="p-5">
            <PanelHeading icon={AlertTriangle} title="Feedback" subtitle="mentor-grade notes" />
            <p className="mt-5 text-sm leading-6 text-sky-100/75">
              You correctly prioritized the accepted SSH login over later benign admin noise. The
              audit evidence confirms impact through credential file access.
            </p>
            <div className="mt-5 rounded-md border border-amber/30 bg-amber/10 p-4">
              <strong className="text-amber">Missed evidence</strong>
              <p className="mt-2 text-sm text-sky-100/72">
                Correlate firewall allow event with the exact accepted auth timestamp.
              </p>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeading icon={BadgeCheck} title="Evidence verdict" subtitle="citations checked" />
            <div className="mt-5 grid gap-3">
              {evidenceItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-void/65 p-3">
                  <span className="text-sm">{item.title}</span>
                  <span className="font-mono text-xs text-cyan">{item.id}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <GhostButton onClick={() => navigate("report")} className="w-full">Edit Report</GhostButton>
            <SolidButton onClick={() => navigate("scenarios")} icon={ArrowRight} className="w-full">Continue</SolidButton>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function ScoreMetric({ row }: { row: ScoreRow }) {
  return (
    <div className="rounded-md border border-line bg-void/65 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-muted">{row.label}</span>
        <strong className={`font-mono text-2xl ${toneText(row.tone)}`}>{row.value}</strong>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
        <span className={`block h-full rounded-full ${row.tone === "amber" ? "bg-amber" : row.tone === "violet" ? "bg-violet" : row.tone === "leaf" ? "bg-leaf" : "bg-cyan"}`} style={{ width: `${(row.value / row.max) * 100}%` }} />
      </div>
    </div>
  );
}
