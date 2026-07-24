import { useCallback } from "react";
import { useAuth } from "./AuthContext";

export type StudioDifficulty = "beginner" | "intermediate" | "advanced";
export type ThreatSource = "cve" | "nvd" | "mitre" | "cisa_kev" | "epss" | "custom";
export type DraftStatus =
  | "draft"
  | "pending_ai_review"
  | "needs_revision"
  | "pending_human_review"
  | "approved"
  | "rejected"
  | "published";

export type SafetyCheckResult = {
  passed: boolean;
  ip_validation: boolean;
  no_real_companies: boolean;
  no_real_credentials: boolean;
  no_exploit_commands: boolean;
  no_malware_code: boolean;
  no_destructive_commands: boolean;
  violations: string[];
};

export type ScenarioConfig = {
  id: string;
  title: string;
  difficulty: StudioDifficulty;
  time_limit: number;
  hint_budget: number;
  timeline_day: number;
  description: string;
  objectives: string[];
  logs: Record<string, unknown>;
  expected_findings: Record<string, unknown>;
  grading_rubric: Record<string, number>;
  debate_questions: string[];
};

export type ScenarioDraft = {
  draft_id: string;
  author_id: string | null;
  status: DraftStatus;
  config: ScenarioConfig;
  source_type: "ai_generated" | "user_submitted";
  threat_intel_source: Record<string, unknown> | null;
  ai_review_score: number | null;
  ai_review_feedback: string | null;
  safety_check_results: SafetyCheckResult | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
};

export type GenerateScenarioPayload = {
  topic: string;
  difficulty: StudioDifficulty;
  source: ThreatSource;
  cve_id?: string;
  technique_id?: string;
  time_limit?: number;
};

export type ReviewResult = {
  realism_score: number;
  objectives_clarity: number;
  answer_fairness: number;
  evidence_sufficiency: number;
  red_herring_balance: number;
  difficulty_calibration: number;
  safety_score: number;
  debate_quality: number;
  log_generability: number;
  overall_score: number;
  passed: boolean;
  feedback: string;
  revision_suggestions: string[];
};

export type ReviewJob = {
  job_id: string;
  draft_id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  result: ReviewResult | null;
};

export type ValidationResult = {
  valid: boolean;
  schema_valid: boolean;
  safety_check: SafetyCheckResult | null;
  errors: string[];
};

export type ThreatDataItem = {
  source: ThreatSource;
  identifier: string;
  title: string;
  summary: string;
  severity: string | null;
  epss_score: number | null;
};

export function useStudioAPI() {
  const { apiFetch } = useAuth();

  return {
    listCatalog: useCallback(() => apiFetch<ScenarioConfig[]>("/studio/catalog"), [apiFetch]),
    listDrafts: useCallback((status?: DraftStatus) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return apiFetch<ScenarioDraft[]>(`/studio/drafts${query}`);
    }, [apiFetch]),
    generateScenario: useCallback(
      (body: GenerateScenarioPayload) =>
        apiFetch<ScenarioDraft>("/studio/generate", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      [apiFetch],
    ),
    submitDraft: useCallback(
      (draftId: string) =>
        apiFetch<ReviewJob>("/studio/submit", {
          method: "POST",
          body: JSON.stringify({ draft_id: draftId }),
        }),
      [apiFetch],
    ),
    getReviewJob: useCallback((jobId: string) => apiFetch<ReviewJob>(`/studio/review/${jobId}`), [apiFetch]),
    validateScenario: useCallback(
      (config: unknown) =>
        apiFetch<ValidationResult>("/studio/validate", {
          method: "POST",
          body: JSON.stringify(config),
        }),
      [apiFetch],
    ),
    uploadScenario: useCallback(
      (config: unknown) =>
        apiFetch<ScenarioDraft>("/studio/upload", {
          method: "POST",
          body: JSON.stringify(config),
        }),
      [apiFetch],
    ),
    browseThreatData: useCallback(
      (source: ThreatSource, keyword?: string) => {
        const params = new URLSearchParams({ source });
        if (keyword) params.set("keyword", keyword);
        return apiFetch<ThreatDataItem[]>(`/studio/threat-data?${params.toString()}`);
      },
      [apiFetch],
    ),
  };
}
