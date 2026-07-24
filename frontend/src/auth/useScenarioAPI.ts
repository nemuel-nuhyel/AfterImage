import { useCallback } from "react";
import { useAuth } from "./AuthContext";

export type StartScenarioRequest = {
  mode?: "practice" | "timed" | "exam";
};

export function useScenarioAPI() {
  const { apiFetch } = useAuth();

  return {
    listScenarios: useCallback(() => apiFetch("/scenarios"), [apiFetch]),
    getScenario: useCallback((scenarioId: string) => apiFetch(`/scenarios/${scenarioId}`), [apiFetch]),
    startScenario: useCallback(
      (scenarioId: string, body: StartScenarioRequest = { mode: "timed" }) =>
        apiFetch(`/scenarios/${scenarioId}/start`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      [apiFetch],
    ),
    getSession: useCallback((sessionId: string) => apiFetch(`/sessions/${sessionId}`), [apiFetch]),
    listSessionLogs: useCallback((sessionId: string) => apiFetch(`/sessions/${sessionId}/logs`), [apiFetch]),
    getSessionLog: useCallback(
      (sessionId: string, file: string) => apiFetch(`/sessions/${sessionId}/logs/${encodeURIComponent(file)}`),
      [apiFetch],
    ),
    listEvidence: useCallback((sessionId: string) => apiFetch(`/sessions/${sessionId}/evidence`), [apiFetch]),
    markEvidence: useCallback(
      (sessionId: string, body: unknown) =>
        apiFetch(`/sessions/${sessionId}/evidence`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      [apiFetch],
    ),
    updateEvidence: useCallback(
      (sessionId: string, evidenceId: string, body: unknown) =>
        apiFetch(`/sessions/${sessionId}/evidence/${evidenceId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      [apiFetch],
    ),
    deleteEvidence: useCallback(
      (sessionId: string, evidenceId: string) =>
        apiFetch(`/sessions/${sessionId}/evidence/${evidenceId}`, {
          method: "DELETE",
        }),
      [apiFetch],
    ),
    getReportDraft: useCallback((sessionId: string) => apiFetch(`/sessions/${sessionId}/report/draft`), [apiFetch]),
    saveReportDraft: useCallback(
      (sessionId: string, body: unknown) =>
        apiFetch(`/sessions/${sessionId}/report/draft`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      [apiFetch],
    ),
    submitReport: useCallback(
      (sessionId: string) =>
        apiFetch(`/sessions/${sessionId}/report/submit`, {
          method: "POST",
        }),
      [apiFetch],
    ),
  };
}
