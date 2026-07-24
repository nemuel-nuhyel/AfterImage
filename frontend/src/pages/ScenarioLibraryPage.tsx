import { CheckCircle2, Clock3, Database, Filter, Play, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Navigate, Scenario } from "../types";
import { scenarios } from "../data/aftermath";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

const difficultyFilters = ["All", "Beginner", "Intermediate", "Advanced"];
const statusFilters = ["All", "New", "In Progress", "Completed", "Locked"];
const modeFilters = ["All", "Practice", "Timed", "Exam"];

export function ScenarioLibraryPage({ navigate }: { navigate: Navigate }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("All");
  const [mode, setMode] = useState("All");

  const filteredScenarios = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${scenario.title} ${scenario.summary} ${scenario.attack}`.toLowerCase().includes(normalizedQuery);
      const matchesDifficulty = difficulty === "All" || scenario.difficulty === difficulty;
      const matchesStatus = status === "All" || scenario.status === status;
      const matchesMode = mode === "All" || scenario.mode === mode;
      return matchesQuery && matchesDifficulty && matchesStatus && matchesMode;
    });
  }, [difficulty, mode, query, status]);

  const inProgress = scenarios.filter((item) => item.status === "In Progress").length;
  const completed = scenarios.filter((item) => item.status === "Completed").length;

  return (
    <PageFrame>
      <PageHeader
        kicker="Scenario Library"
        title="Pick a case and get into the evidence."
        copy="Cases are ordered by recommended progression. Filter by difficulty, status, and mode without leaving the queue."
        action={
          <SolidButton onClick={() => navigate("briefing")} icon={Play}>
            Start Recommended
          </SolidButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel className="p-5">
          <PanelHeading icon={SlidersHorizontal} title="Filters" subtitle={`${filteredScenarios.length} visible`} />
          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="flex min-h-11 items-center gap-3 rounded-md border border-line2 bg-void/70 px-4">
                <Search size={17} className="text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cases, attacks, or artifacts..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {difficultyFilters.map((item) => (
                  <FilterButton key={item} active={difficulty === item} onClick={() => setDifficulty(item)}>
                    {item}
                  </FilterButton>
                ))}
              </div>
              <GhostButton onClick={() => setQuery("")} icon={Filter} className="min-h-11 px-4">
                Reset
              </GhostButton>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <FilterGroup label="Status">
                {statusFilters.map((item) => (
                  <FilterButton key={item} active={status === item} onClick={() => setStatus(item)}>
                    {item}
                  </FilterButton>
                ))}
              </FilterGroup>
              <FilterGroup label="Mode">
                {modeFilters.map((item) => (
                  <FilterButton key={item} active={mode === item} onClick={() => setMode(item)}>
                    {item}
                  </FilterButton>
                ))}
              </FilterGroup>
            </div>
          </div>
        </Panel>

        <Panel className="grid gap-4 p-5">
          <PanelHeading icon={CheckCircle2} title="Library health" subtitle="training inventory" />
          <div className="grid grid-cols-2 gap-3">
            <SummaryStat label="In progress" value={inProgress} tone="cyan" />
            <SummaryStat label="Completed" value={completed} tone="leaf" />
          </div>
          <div className="rounded-md border border-line bg-void/65 p-4 text-sm leading-6 text-sky-100/74">
            Next best action: finish the active SSH case before opening a new timed scenario.
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredScenarios.map((caseFile) => (
          <ScenarioCard key={caseFile.id} scenario={caseFile} navigate={navigate} />
        ))}
        {filteredScenarios.length === 0 && (
          <Panel className="p-8 text-center text-muted lg:col-span-2">
            No scenarios match the current filters.
          </Panel>
        )}
      </div>
    </PageFrame>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-void/45 p-3">
      <span className="mb-3 block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-md border px-3 text-sm transition focus-visible:app-focus ${
        active ? "border-cyan/45 bg-cyan/12 text-cyan" : "border-line bg-panel2/45 text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "cyan" | "leaf" }) {
  return (
    <div className="rounded-md border border-line bg-void/65 p-4">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">{label}</span>
      <strong className={`mt-3 block text-3xl ${tone === "leaf" ? "text-leaf" : "text-cyan"}`}>{value}</strong>
    </div>
  );
}

function ScenarioCard({ scenario, navigate }: { scenario: Scenario; navigate: Navigate }) {
  const Icon = scenario.icon;
  const statusTone = scenario.status === "Completed" ? "leaf" : scenario.status === "Locked" ? "muted" : "cyan";
  const canStart = scenario.status !== "Locked";

  return (
    <Panel className="grid gap-5 p-5">
      <div className="grid gap-4 md:grid-cols-[3rem_1fr_auto]">
        <span className="grid h-12 w-12 place-items-center rounded-lg border border-line2 bg-void/65 text-cyan">
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black">{scenario.title}</h2>
            <Status tone={statusTone}>{scenario.status}</Status>
          </div>
          <p className="mt-2 text-sm leading-6 text-sky-100/72">{scenario.summary}</p>
        </div>
        <div className="flex flex-row gap-2 md:flex-col md:items-end">
          <span className="rounded-md border border-line bg-void/65 px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
            {scenario.id}
          </span>
          <span className="rounded-md border border-line bg-void/65 px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
            {scenario.progress}% ready
          </span>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-line bg-void/45 p-4 sm:grid-cols-3">
        <Meta icon={Clock3} label="Duration" value={`${scenario.duration} / ${scenario.mode}`} />
        <Meta icon={Filter} label="Attack" value={scenario.attack} />
        <Meta icon={Database} label="Difficulty" value={scenario.difficulty} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-2 min-w-52 flex-1 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-cyan" style={{ width: `${Math.max(scenario.progress, 8)}%` }} />
        </div>
        <div className="flex gap-2">
          <GhostButton onClick={() => navigate("briefing")} className="min-h-10 px-4">
            Brief
          </GhostButton>
          <SolidButton onClick={() => navigate("workspace")} icon={Play} className="min-h-10 px-4" type="button" disabled={!canStart}>
            {canStart ? "Open" : "Locked"}
          </SolidButton>
        </div>
      </div>
    </Panel>
  );
}

function Meta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-cyan" />
      <span>
        <span className="block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">{label}</span>
        <strong className="text-sm">{value}</strong>
      </span>
    </div>
  );
}
