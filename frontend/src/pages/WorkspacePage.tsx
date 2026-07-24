import { Check, FileText, Filter, Lightbulb, Pin, Search, ShieldCheck, Terminal, Timer, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { LogRow, Navigate } from "../types";
import { evidenceItems, logRows, objectives, scenario } from "../data/aftermath";
import { logSeverityClass, toneBg, toneBorder, toneText } from "../lib/tone";
import { PageFrame } from "../components/layout/PageHeader";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

const sources = [
  ["auth.log", "112", "active"],
  ["firewall.log", "94", "idle"],
  ["audit.log", "63", "idle"],
];

export function WorkspacePage({ navigate }: { navigate: Navigate }) {
  const [selectedId, setSelectedId] = useState("009");
  const [query, setQuery] = useState("203.0.113.44");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const selected = useMemo(() => logRows.find((row) => row.id === selectedId) ?? logRows[8], [selectedId]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return logRows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${row.time} ${row.source} ${row.text}`.toLowerCase().includes(normalizedQuery);
      const matchesSeverity = !warningsOnly || row.severity === "warn" || row.severity === "critical";
      return matchesQuery && matchesSeverity;
    });
  }, [query, warningsOnly]);

  return (
    <PageFrame>
      <div className="flex flex-col gap-4 border-b border-line pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-line2 bg-panel2 text-cyan">
            <ShieldCheck size={21} />
          </span>
          <div>
            <h1 className="text-2xl font-black">{scenario.title}</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{scenario.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Status tone="leaf">Session live</Status>
          <Status tone="amber" icon={Lightbulb}>Hints 2 / 3</Status>
          <Status tone="amber" icon={Timer}>42m left</Status>
          <SolidButton onClick={() => navigate("report")} icon={FileText} className="min-h-10 bg-danger text-white shadow-none hover:bg-danger/90">
            Submit Report
          </SolidButton>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="grid content-start gap-5">
          <Panel className="p-5">
            <PanelHeading icon={Terminal} title="Sources" subtitle="3 streams mounted" />
            <div className="mt-5 grid gap-2">
              {sources.map(([source, lines, state]) => (
                <button
                  key={source}
                  type="button"
                  className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-left transition ${
                    state === "active" ? "border-cyan/40 bg-cyan/12 text-cyan" : "border-line bg-void/55 text-muted hover:text-text"
                  }`}
                >
                  <span className="font-mono text-sm">{source}</span>
                  <span className="font-mono text-xs">{lines}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeading icon={Check} title="Objectives" subtitle="2 of 4 supported" />
            <div className="mt-5 grid gap-3">
              {objectives.map((objective, index) => (
                <div key={objective} className="flex gap-3 text-sm leading-6 text-sky-100/82">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${index < 2 ? "border-leaf/35 bg-leaf/10 text-leaf" : "border-line text-muted"}`}>
                    {index < 2 && <Check size={13} />}
                  </span>
                  {objective}
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <PanelHeading icon={Zap} title="Hint budget" subtitle="1 remaining" />
              <strong className="font-mono text-3xl text-amber">1</strong>
            </div>
            <GhostButton icon={Zap} className="mt-5 w-full min-h-10 px-3">
              Reveal Hint (-4 pts)
            </GhostButton>
          </Panel>
        </aside>

        <Panel className="min-w-0 overflow-hidden">
          <div className="grid gap-4 border-b border-line bg-panel2/35 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {["auth.log", "firewall.log", "audit.log"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-md border px-4 py-2 font-mono text-sm transition ${
                      tab === "auth.log" ? "border-cyan/40 bg-void text-cyan" : "border-line bg-panel/60 text-muted hover:text-text"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {filteredRows.length} visible lines
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex min-h-10 flex-1 items-center gap-3 rounded-md border border-line bg-void/70 px-4 text-sm text-sky-100">
                <Search size={16} className="text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:text-muted"
                  placeholder="Search logs..."
                />
              </label>
              <GhostButton icon={Filter} className="min-h-10 px-4">
                Filters
              </GhostButton>
              <button
                type="button"
                onClick={() => setWarningsOnly((value) => !value)}
                className={`min-h-10 rounded-md border px-4 text-sm font-bold transition ${
                  warningsOnly ? "border-amber/40 bg-amber/10 text-amber" : "border-line2 bg-void/45 text-text hover:border-cyan/45"
                }`}
              >
                Warnings only
              </button>
            </div>
          </div>

          <div className="max-h-[660px] overflow-auto bg-void/88 p-3">
            {filteredRows.map((row) => (
              <LogLine key={row.id} row={row} selected={row.id === selectedId} onSelect={() => setSelectedId(row.id)} />
            ))}
            {filteredRows.length === 0 && (
              <div className="rounded-md border border-line bg-panel/50 p-6 text-center text-muted">
                No log rows match the current search.
              </div>
            )}
          </div>
        </Panel>

        <aside className="grid content-start gap-5">
          <Panel className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <PanelHeading icon={Pin} title="Evidence inspector" subtitle={`${evidenceItems.length} pinned`} />
              <button type="button" onClick={() => navigate("evidence")} className="font-mono text-xs uppercase tracking-[0.18em] text-cyan">
                Board
              </button>
            </div>

            <div className="rounded-md border border-cyan/35 bg-cyan/8 p-4">
              <div className="flex items-center justify-between font-mono text-xs text-muted">
                <span>auth.log - L{selected.id}</span>
                <span>{selected.time}</span>
              </div>
              <p className="mt-4 rounded-md border border-line bg-void/78 p-3 font-mono text-sm leading-6 text-sky-100/88">
                {selected.text}
              </p>
              <textarea
                className="mt-3 min-h-24 w-full rounded-md border border-line2 bg-void/80 p-3 text-sm leading-6 outline-none focus:border-cyan/55"
                defaultValue="Successful login from hostile IP after 41 failures - credential compromise of deploy account."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {evidenceItems[0].tags.map((tag) => (
                  <span key={tag.label} className={`rounded border px-2 py-1 font-mono text-xs ${toneBorder(tag.tone)} ${toneBg(tag.tone)} ${toneText(tag.tone)}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                Confidence
                {[1, 2, 3, 4, 5].map((dot) => (
                  <span key={dot} className="h-4 w-4 rounded bg-cyan" />
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeading icon={ShieldCheck} title="Suspicious entities" subtitle="extracted from pins" />
            <div className="mt-5 grid gap-2">
              {["ip 203.0.113.44", "user deploy", "service sshd", "file /etc/shadow"].map((entity) => (
                <div key={entity} className="rounded-md border border-line bg-void/65 px-4 py-3 font-mono text-sm text-sky-100">
                  {entity}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </PageFrame>
  );
}

function LogLine({ row, selected, onSelect }: { row: LogRow; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full min-w-[760px] grid-cols-[3rem_5.5rem_8rem_minmax(0,1fr)_7rem] items-center gap-4 border-l-2 px-4 py-2.5 text-left font-mono text-sm transition hover:bg-panel/40 ${logSeverityClass(row.severity)} ${
        selected ? "bg-cyan/12 shadow-[inset_3px_0_0_rgba(94,231,220,1)]" : ""
      }`}
    >
      <span className="text-slate-500">{Number(row.id)}</span>
      <span className="text-slate-500">{row.time}</span>
      <span className={row.severity === "warn" ? "text-amber" : "text-violet"}>{row.source}</span>
      <span className="truncate">{row.text}</span>
      {selected ? (
        <span className="rounded border border-leaf/35 bg-leaf/10 px-2 py-1 text-center text-xs text-leaf">
          Selected
        </span>
      ) : (
        <span className="text-center text-xs text-muted">Pin</span>
      )}
    </button>
  );
}
