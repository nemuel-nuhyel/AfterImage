import { FileText, Pin, Send, ShieldCheck } from "lucide-react";
import type { Navigate } from "../types";
import { evidenceItems, scenario } from "../data/aftermath";
import { toneBg, toneBorder, toneText } from "../lib/tone";
import { PageFrame, PageHeader } from "../components/layout/PageHeader";
import { SolidButton } from "../components/ui/Button";
import { Panel, PanelHeading } from "../components/ui/Panel";
import { Status } from "../components/ui/Status";

export function ReportPage({ navigate }: { navigate: Navigate }) {
  return (
    <PageFrame>
      <PageHeader
        kicker="Incident Report"
        title="Submit defensible findings"
        copy="A strong report connects attack timeline, entities, impact, and response actions directly to marked evidence."
        action={<SolidButton onClick={() => navigate("debrief")} icon={Send}>Submit Report</SolidButton>}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <Status tone="amber">Draft</Status>
              <h2 className="mt-4 text-2xl font-black">INC-2024-0473 - {scenario.title}</h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Autosaved</span>
          </div>

          <form className="grid gap-6">
            <label className="grid gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-muted">What happened?</span>
              <textarea
                className="min-h-40 rounded-md border border-line2 bg-void/78 p-4 leading-7 outline-none focus:border-cyan/55"
                defaultValue="A brute-force SSH sequence against multiple usernames was followed by a successful login to deploy from 203.0.113.44. The same account then accessed /etc/shadow through sudo, indicating credential compromise and post-authentication impact."
              />
            </label>

            <div className="grid gap-5 md:grid-cols-[1fr_260px]">
              <label className="grid gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.35em] text-muted">Suspicious entities</span>
                <input
                  className="min-h-12 rounded-md border border-line2 bg-void/78 px-4 outline-none focus:border-cyan/55"
                  defaultValue="203.0.113.44, deploy, sshd, /etc/shadow"
                />
              </label>
              <label className="grid gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.35em] text-muted">Attack succeeded?</span>
                <select className="min-h-12 rounded-md border border-line2 bg-void/78 px-4 outline-none focus:border-cyan/55" defaultValue="yes">
                  <option value="yes">Yes, likely succeeded</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
            </div>

            <label className="grid gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-muted">Confidence level</span>
              <div className="flex items-center gap-5 rounded-md border border-line2 bg-void/78 p-4">
                <input className="flex-1 accent-cyan" type="range" min="1" max="5" defaultValue="4" />
                <strong className="font-mono text-cyan">4 / 5</strong>
              </div>
            </label>

            <label className="grid gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-muted">Response actions</span>
              <textarea
                className="min-h-36 rounded-md border border-line2 bg-void/78 p-4 leading-7 outline-none focus:border-cyan/55"
                defaultValue="Disable deploy, rotate credentials, review sudoers policy, preserve logs, block 203.0.113.44, and hunt for follow-on access from the compromised account."
              />
            </label>
          </form>
        </Panel>

        <div className="grid gap-5">
          <Panel className="p-5">
            <PanelHeading icon={Pin} title="Evidence references" subtitle="3 citations attached" />
            <div className="mt-5 grid gap-3">
              {evidenceItems.map((item) => (
                <div key={item.id} className="rounded-md border border-line bg-void/65 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{item.source}:L{item.line}</strong>
                    <span className="font-mono text-xs text-muted">{item.time}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-mono text-xs leading-5 text-sky-100/75">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeading icon={FileText} title="Report checks" subtitle="rubric estimate" />
            <div className="mt-5 grid gap-3">
              {[
                ["Evidence cited", "leaf"],
                ["Attack success stated", "leaf"],
                ["Impact explained", "leaf"],
                ["Containment includes owner", "amber"],
              ].map(([label, tone]) => (
                <div key={label} className={`rounded-md border p-3 ${toneBorder(tone)} ${toneBg(tone)} ${toneText(tone)}`}>
                  {label}
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <Status tone="cyan" icon={ShieldCheck}>Ready to submit</Status>
            <p className="mt-4 text-sm leading-6 text-sky-100/72">
              Submission will lock report text, evidence citations, and confidence score for debrief comparison.
            </p>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}
