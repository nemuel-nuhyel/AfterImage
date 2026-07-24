import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  FileKey,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  WandSparkles,
} from "lucide-react";
import type { Navigate } from "../types";
import type { Tone } from "../types";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";
import {
  type DraftStatus,
  type ReviewJob,
  type ScenarioDraft,
  type StudioDifficulty,
  type ThreatDataItem,
  type ThreatSource,
  type ValidationResult,
  useStudioAPI,
} from "../auth/useStudioAPI";

type Tab = "generate" | "submit";

const difficultyOptions: StudioDifficulty[] = ["beginner", "intermediate", "advanced"];
const sourceOptions: Array<{ value: ThreatSource; label: string }> = [
  { value: "custom", label: "Custom" },
  { value: "cve", label: "CVE" },
  { value: "mitre", label: "MITRE" },
  { value: "cisa_kev", label: "CISA KEV" },
];

export function StudioPage({ navigate }: { navigate: Navigate }) {
  const {
    browseThreatData,
    generateScenario,
    listDrafts,
    submitDraft,
    uploadScenario,
    validateScenario,
  } = useStudioAPI();
  const [tab, setTab] = useState<Tab>("generate");
  const [topic, setTopic] = useState("SSH brute force");
  const [difficulty, setDifficulty] = useState<StudioDifficulty>("beginner");
  const [source, setSource] = useState<ThreatSource>("custom");
  const [cveId, setCveId] = useState("");
  const [techniqueId, setTechniqueId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [drafts, setDrafts] = useState<ScenarioDraft[]>([]);
  const [preview, setPreview] = useState<ScenarioDraft | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [reviewJob, setReviewJob] = useState<ReviewJob | null>(null);
  const [threatData, setThreatData] = useState<ThreatDataItem[]>([]);
  const [busy, setBusy] = useState<"generate" | "validate" | "upload" | "submit" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshDrafts = useCallback(async () => {
    const nextDrafts = await listDrafts();
    setDrafts(nextDrafts);
  }, [listDrafts]);

  useEffect(() => {
    void refreshDrafts().catch((refreshError: unknown) => {
      setError(readError(refreshError));
    });
  }, [refreshDrafts]);

  useEffect(() => {
    void browseThreatData(source).then(setThreatData).catch(() => {
      setThreatData([]);
    });
  }, [browseThreatData, source]);

  const reviewableDrafts = useMemo(() => drafts.slice(0, 5), [drafts]);

  async function handleGenerate() {
    setBusy("generate");
    setError(null);
    try {
      const generated = await generateScenario({
        topic,
        difficulty,
        source,
        cve_id: cveId.trim() || undefined,
        technique_id: techniqueId.trim() || undefined,
        time_limit: difficulty === "advanced" ? 1200 : 900,
      });
      setPreview(generated);
      setJsonText(JSON.stringify(generated.config, null, 2));
      setValidation(null);
      await refreshDrafts();
    } catch (generateError) {
      setError(readError(generateError));
    } finally {
      setBusy(null);
    }
  }

  async function handleValidate() {
    setBusy("validate");
    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      setValidation(await validateScenario(parsed));
    } catch (validateError) {
      setValidation({
        valid: false,
        schema_valid: false,
        safety_check: null,
        errors: [readError(validateError)],
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload() {
    setBusy("upload");
    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const uploaded = await uploadScenario(parsed);
      setPreview(uploaded);
      setValidation(uploaded.safety_check_results ? {
        valid: uploaded.safety_check_results.passed,
        schema_valid: true,
        safety_check: uploaded.safety_check_results,
        errors: uploaded.safety_check_results.violations,
      } : null);
      await refreshDrafts();
    } catch (uploadError) {
      setError(readError(uploadError));
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit(draftId: string) {
    setBusy("submit");
    setError(null);
    try {
      const job = await submitDraft(draftId);
      setReviewJob(job);
      await refreshDrafts();
    } catch (submitError) {
      setError(readError(submitError));
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    setBusy("refresh");
    setError(null);
    try {
      await refreshDrafts();
    } catch (refreshError) {
      setError(readError(refreshError));
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageFrame>
      <PageHeader
        kicker="Scenario Studio"
        title="Generate, submit, and review case files"
        copy="Reviewer and admin workspace for scenario drafts, AI generation, safety checks, and human approval."
        action={<SolidButton onClick={() => navigate("scenarios")} icon={FileKey}>Back to Scenarios</SolidButton>}
      />

      {error && (
        <div className="mb-5 rounded-md border border-danger/35 bg-danger/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <Panel className="p-6">
          <PanelHeading
            icon={tab === "generate" ? WandSparkles : Upload}
            title={tab === "generate" ? "Generate scenario" : "Submit scenario JSON"}
            subtitle={tab === "generate" ? "threat data draft pipeline" : "schema and safety validation"}
            action={
              <div className="inline-flex rounded-md border border-line2 bg-void/60 p-1">
                {(["generate", "submit"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`rounded px-3 py-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] transition ${
                      tab === item ? "bg-cyan text-void" : "text-muted hover:text-text"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            }
          />

          {tab === "generate" ? (
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <FieldLabel>Topic</FieldLabel>
                <textarea
                  className="min-h-32 rounded-md border border-line2 bg-void/75 p-4 outline-none transition focus:border-cyan/55"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                {difficultyOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDifficulty(item)}
                    className={`rounded-md border px-4 py-3 text-sm font-black capitalize transition ${
                      difficulty === item
                        ? "border-cyan/70 bg-cyan/12 text-cyan"
                        : "border-line bg-void/65 text-muted hover:text-text"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <FieldLabel>Data Source</FieldLabel>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value as ThreatSource)}
                    className="h-12 rounded-md border border-line2 bg-void/75 px-3 outline-none transition focus:border-cyan/55"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <FieldLabel>CVE ID</FieldLabel>
                  <input
                    value={cveId}
                    onChange={(event) => setCveId(event.target.value)}
                    className="h-12 rounded-md border border-line2 bg-void/75 px-3 outline-none transition focus:border-cyan/55"
                    placeholder="CVE-2024-6387"
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Technique ID</FieldLabel>
                  <input
                    value={techniqueId}
                    onChange={(event) => setTechniqueId(event.target.value)}
                    className="h-12 rounded-md border border-line2 bg-void/75 px-3 outline-none transition focus:border-cyan/55"
                    placeholder="T1110"
                  />
                </label>
              </div>

              <SolidButton icon={WandSparkles} onClick={() => void handleGenerate()} disabled={busy === "generate"}>
                {busy === "generate" ? "Generating" : "Generate Draft"}
              </SolidButton>

              <ThreatDataList items={threatData} />
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <FieldLabel>Scenario JSON</FieldLabel>
                <textarea
                  className="min-h-[360px] rounded-md border border-line2 bg-void/75 p-4 font-mono text-xs leading-relaxed outline-none transition focus:border-cyan/55"
                  value={jsonText}
                  onChange={(event) => setJsonText(event.target.value)}
                  spellCheck={false}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <GhostButton icon={ShieldCheck} onClick={() => void handleValidate()} disabled={!jsonText || busy === "validate"}>
                  {busy === "validate" ? "Validating" : "Validate"}
                </GhostButton>
                <SolidButton icon={Upload} onClick={() => void handleUpload()} disabled={!jsonText || busy === "upload"}>
                  {busy === "upload" ? "Saving" : "Save Draft"}
                </SolidButton>
              </div>
              {validation && <ValidationResultPanel result={validation} />}
            </div>
          )}
        </Panel>

        <div className="grid content-start gap-5">
          <Panel className="p-6">
            <PanelHeading
              icon={ClipboardList}
              title="Review queue"
              subtitle={`${drafts.length} drafts tracked`}
              action={
                <GhostButton icon={RefreshCw} onClick={() => void handleRefresh()} disabled={busy === "refresh"} className="min-h-9 px-3">
                  Refresh
                </GhostButton>
              }
            />
            <div className="mt-6 grid gap-3">
              {reviewableDrafts.length === 0 && (
                <div className="rounded-md border border-line bg-void/55 p-4 text-sm text-muted">No drafts yet.</div>
              )}
              {reviewableDrafts.map((draft) => (
                <DraftQueueItem
                  key={draft.draft_id}
                  draft={draft}
                  busy={busy === "submit"}
                  onPreview={() => {
                    setPreview(draft);
                    setJsonText(JSON.stringify(draft.config, null, 2));
                  }}
                  onSubmit={() => void handleSubmit(draft.draft_id)}
                />
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <PanelHeading icon={Database} title="Draft preview" subtitle={preview ? preview.config.id : "no active draft"} />
            {preview ? (
              <div className="mt-6 grid gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="min-w-0 text-xl font-black">{preview.config.title}</h2>
                    <Status tone={statusTone(preview.status)}>{preview.status}</Status>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sky-100/78">{preview.config.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Difficulty" value={preview.config.difficulty} />
                  <Metric label="Logs" value={Object.keys(preview.config.logs).length.toString()} />
                  <Metric label="Safety" value={preview.safety_check_results?.passed ? "pass" : "check"} />
                </div>
                <div className="rounded-md border border-line bg-void/55 p-4">
                  <FieldLabel>Objectives</FieldLabel>
                  <ul className="mt-3 grid gap-2 text-sm text-sky-100/78">
                    {preview.config.objectives.map((objective) => (
                      <li key={objective} className="flex gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-leaf" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <SolidButton
                  icon={Send}
                  onClick={() => void handleSubmit(preview.draft_id)}
                  disabled={!canSubmit(preview.status) || busy === "submit"}
                >
                  {busy === "submit" ? "Submitting" : "Submit for Review"}
                </SolidButton>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-line bg-void/55 p-4 text-sm text-muted">Generate or select a draft.</div>
            )}
          </Panel>

          {reviewJob?.result && (
            <Panel className="p-6">
              <PanelHeading
                icon={reviewJob.result.passed ? CheckCircle2 : AlertTriangle}
                title="Latest review"
                subtitle={reviewJob.job_id}
              />
              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Overall score</span>
                  <Status tone={reviewJob.result.passed ? "leaf" : "amber"}>{formatScore(reviewJob.result.overall_score)}</Status>
                </div>
                <p className="text-sm leading-6 text-sky-100/78">{reviewJob.result.feedback}</p>
                {reviewJob.result.revision_suggestions.length > 0 && (
                  <ul className="grid gap-2 text-sm text-amber-100/88">
                    {reviewJob.result.revision_suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function ThreatDataList({ items }: { items: ThreatDataItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-3">
      <FieldLabel>Threat data</FieldLabel>
      {items.slice(0, 3).map((item) => (
        <div key={`${item.source}-${item.identifier}`} className="rounded-md border border-line bg-void/55 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Status tone="violet">{item.source}</Status>
            <strong className="font-mono text-xs text-cyan">{item.identifier}</strong>
          </div>
          <p className="mt-2 text-sm font-black">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
        </div>
      ))}
    </div>
  );
}

function DraftQueueItem({
  draft,
  busy,
  onPreview,
  onSubmit,
}: {
  draft: ScenarioDraft;
  busy: boolean;
  onPreview: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-void/65 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate">{draft.config.title}</strong>
          <p className="mt-2 font-mono text-xs text-muted">
            {draft.config.difficulty} - {draft.source_type.replace("_", " ")}
          </p>
        </div>
        <Status tone={statusTone(draft.status)}>{draft.status}</Status>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <GhostButton onClick={onPreview} className="min-h-9 px-3">Preview</GhostButton>
        <SolidButton icon={Send} onClick={onSubmit} disabled={!canSubmit(draft.status) || busy} className="min-h-9 px-3">
          Review
        </SolidButton>
      </div>
    </div>
  );
}

function ValidationResultPanel({ result }: { result: ValidationResult }) {
  return (
    <div className="rounded-md border border-line bg-void/55 p-4">
      <div className="flex flex-wrap gap-2">
        <Status tone={result.schema_valid ? "leaf" : "danger"}>{result.schema_valid ? "schema pass" : "schema fail"}</Status>
        <Status tone={result.safety_check?.passed ? "leaf" : "danger"}>
          {result.safety_check?.passed ? "safety pass" : "safety fail"}
        </Status>
      </div>
      {result.errors.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm text-amber-100/88">
          {result.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted">{children}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-void/55 p-3">
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 truncate text-sm font-black capitalize">{value}</div>
    </div>
  );
}

function statusTone(status: DraftStatus): Tone {
  if (status === "published" || status === "approved") return "leaf";
  if (status === "needs_revision" || status === "pending_human_review") return "amber";
  if (status === "rejected") return "danger";
  if (status === "pending_ai_review") return "violet";
  return "cyan";
}

function canSubmit(status: DraftStatus) {
  return status === "draft" || status === "needs_revision";
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function readError(value: unknown) {
  return value instanceof Error ? value.message : String(value);
}
