import { FileText, Pin, Plus, ShieldCheck } from "lucide-react";
import type { EvidenceItem, Navigate } from "../types";
import { evidenceItems } from "../data/aftermath";
import { toneBg, toneBorder, toneDot, toneText } from "../lib/tone";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { SolidButton } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

export function EvidencePage({ navigate }: { navigate: Navigate }) {
  return (
    <PageFrame>
      <PageHeader
        kicker="Evidence Board"
        title="Build the case from exact artifacts"
        copy="Each pinned line should explain why the incident succeeded, what account was affected, and which response is justified."
        action={<SolidButton onClick={() => navigate("report")} icon={FileText}>Draft Report</SolidButton>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {evidenceItems.map((item) => (
            <EvidenceCard key={item.id} item={item} />
          ))}
        </div>

        <div className="grid gap-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <Status tone="cyan" icon={Pin}>3 pinned</Status>
              <button type="button" className="text-cyan">
                <Plus size={18} />
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ["203.0.113.44", "hostile source ip", "danger"],
                ["deploy", "compromised user", "amber"],
                ["sshd", "initial service", "cyan"],
                ["/etc/shadow", "credential impact", "violet"],
              ].map(([value, label, tone]) => (
                <div key={value} className={`rounded-md border p-4 ${toneBorder(tone)} ${toneBg(tone)}`}>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted">{label}</span>
                  <strong className={`mt-2 block ${toneText(tone)}`}>{value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <Status tone="leaf" icon={ShieldCheck}>Case strength</Status>
            <div className="mt-6 grid gap-3">
              {["Initial access supported", "Impact supported", "Network corroboration supported", "Containment action pending"].map((item, index) => (
                <div key={item} className="flex items-center justify-between gap-4 rounded-md border border-line bg-void/65 p-3">
                  <span className="text-sm text-sky-100/80">{item}</span>
                  <span className={index < 3 ? "text-leaf" : "text-amber"}>{index < 3 ? "ok" : "todo"}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <Panel className="grid min-h-[320px] p-5">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-cyan">{item.id}</span>
          <span className="font-mono text-xs text-muted">{item.time}</span>
        </div>
        <h2 className="mt-5 text-xl font-black">{item.title}</h2>
        <p className="mt-2 font-mono text-xs text-muted">
          {item.source}:L{item.line} - {item.tactic}
        </p>
        <code className="mt-5 block rounded-md border border-line bg-void/70 p-4 font-mono text-sm leading-6 text-sky-100/85">
          {item.content}
        </code>
        <p className="mt-5 text-sm leading-6 text-sky-100/72">{item.note}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 self-end">
        {item.tags.map((tag) => (
          <span key={tag.label} className={`rounded border px-2 py-1 font-mono text-xs ${toneBorder(tag.tone)} ${toneBg(tag.tone)} ${toneText(tag.tone)}`}>
            <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${toneDot(tag.tone)}`} />
            {tag.label}
          </span>
        ))}
      </div>
    </Panel>
  );
}
