// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileKey,
  FileText,
  Gauge,
  Github,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  Pin,
  Play,
  Radio,
  Scale,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Timer,
  UserPlus,
  WandSparkles,
  XCircle,
  Zap,
} from "lucide-react";

const LOGO_MARK_SRC = "/brand/aftermath-logo-front-mark.png";

/* Aftermath - Frontend Prototype v0.8
   Bright, vibrant marketing surface + dark product panels.
   Views: home · login · signup · workspace. Auth is mocked.
*/

const LOG_LINES = [
  { src: "auth.log", t: "03:12:41", body: "sshd[2214]: Failed password for backup_svc from 10.20.14.88", ev: false },
  { src: "auth.log", t: "03:12:44", body: "sshd[2214]: Failed password for backup_svc from 10.20.14.88", ev: false },
  { src: "auth.log", t: "03:12:52", body: "sshd[2231]: Accepted password for backup_svc from 10.20.14.88", ev: true },
  { src: "fw.log", t: "03:13:33", body: "ALLOW TCP 10.20.14.88 -> 10.20.3.5:445 (SMB)", ev: true },
  { src: "auth.log", t: "03:41:19", body: "sshd[2610]: Accepted publickey for jsmith from 192.168.7.30", ev: false },
  { src: "cron", t: "04:00:01", body: "CMD (/usr/local/bin/backup.sh)", ev: false },
];

const HERO_CHALLENGE =
  "backup_svc authenticates before the 04:00 job every night. Two failures then a success reads like a typo, not a brute force. Why does this prove compromise?";
const HERO_DEFENSES = [
  { id: "a", label: "Concede - it's probably the routine backup login", win: false },
  { id: "b", label: "Hold - the SMB connection to 10.20.3.5 is new behavior for this account", win: true },
];

const INTAKE_ROWS = [
  { sev: "warn", text: "auth.log 03:12:52 Accepted password for backup_svc after 2 failures" },
  { sev: "info", text: "dns.log 03:13:02 query dc01.corp.test.local from 10.20.14.88" },
  { sev: "critical", text: "fw.log 03:13:33 ALLOW TCP 10.20.14.88 -> 10.20.3.5:445 (SMB)" },
  { sev: "muted", text: "cron 04:00:01 CMD (/usr/local/bin/backup.sh) - scheduled" },
  { sev: "warn", text: "proxy.log 03:44:10 POST 2.2MB to api.updates-cdn.example.com" },
  { sev: "info", text: "sysmon 03:45:02 process create: powershell.exe (parent: svchost)" },
  { sev: "muted", text: "kev.sync 04:05:00 CISA KEV refreshed - 1 new entry queued for Studio" },
];

const STEPS = [
  { icon: Terminal, title: "Investigate", body: "A timed session drops you into fragmented logs from multiple sources. Some lines matter. Some were planted to test you.", meta: "auth · fw · dns · proxy" },
  { icon: FileKey, title: "Mark evidence", body: "Build your case on the evidence board. Every line you mark is a claim you will have to stand behind.", meta: "evidence chain" },
  { icon: Scale, title: "Submit & debate", body: "File a verdict with confidence, then defend the weak points in your reasoning.", meta: "3 challenge rounds" },
  { icon: Gauge, title: "Scored on defense", body: "The grader reads your evidence chain and how the argument held under pressure. Guessing right scores nothing.", meta: "10-dimension rubric" },
];

const COMPARISON_ROWS = [
  ["Data completeness", "Clean, complete, obvious", "Fragmented, noisy, contradictory"],
  ["Cognitive load", "Single-alert focus", "Multi-source correlation under time pressure"],
  ["False positives", "Rarely trained", "Daily operational reality"],
  ["Hypothesis defense", "Find the right answer", "Defend the assessment to stakeholders"],
  ["Scenario scalability", "Static lab catalog", "Fresh content from structured threat intel"],
];

const STUDIO_STATES = ["draft", "pending_ai_review", "needs_revision", "pending_human_review", "approved", "published"];
const THREAT_SOURCES = [
  ["NVD CVE API", "CVE metadata, CVSS, references, CPE applicability", "24h"],
  ["MITRE ATT&CK TAXII", "Tactics, techniques, procedures, detection guidance", "7d"],
  ["CISA KEV", "Known exploited vulnerabilities and due dates", "6h"],
  ["FIRST EPSS", "Exploit probability scores and percentiles", "24h"],
];
const SAFETY_RULES = [
  { title: "Allowed", tone: "leaf", icon: CheckCircle2, body: "Synthetic logs, fictional companies, RFC 1918 or documentation IP ranges, and normal cybersecurity vocabulary." },
  { title: "Blocked", tone: "danger", icon: AlertTriangle, body: "Real victim names, public target IPs, credentials, exploit commands, malware code, and destructive instructions." },
  { title: "Review principle", tone: "amber", icon: ShieldCheck, body: "The system may describe attacks for analyst training, but generated content must never become operational instruction." },
];
const ROADMAP_ROWS = [
  ["M1", "Core simulator", "FastAPI scaffold, deterministic log synthesis, SQLite session store."],
  ["M2", "Investigation UI", "Workbench, evidence board, timer, report form, debrief screens."],
  ["M3", "AI adversary", "Challenge prompts, grading engine, hints, score visualization."],
  ["M4", "Labs & expansion", "Interactive Docker labs, browser terminal, temporal scenario links."],
  ["M5", "Scenario Studio", "Threat-intel integration, scenario generation, safety and quality review."],
];
const FAQS = [
  { q: "Is any of this real attack data?", a: "No. Every log line, IP address, company, and credential is synthetic. IPs are restricted to RFC 1918 private ranges, and the safety pipeline blocks real victim data, exploit instructions, and malware code." },
  { q: "Do I need to install anything?", a: "No. Investigations and lab terminals run in the browser. Labs are ephemeral server-side environments destroyed when the session ends." },
  { q: "How does scoring work?", a: "A grading engine evaluates the evidence chain and reasoning under challenge. It is a rubric, not a right/wrong lookup." },
  { q: "Where do scenarios come from?", a: "Drafts come from public threat intelligence and community submissions. They pass safety checks, quality review, and human approval before publication." },
];

const WS_ROWS = [
  { id: "001", time: "02:14:07", source: "sshd[2241]", text: "Connection from 203.0.113.44 port 51204 on dev-server ssh2", severity: "info", group: "auth.log" },
  { id: "002", time: "02:14:08", source: "sshd[2241]", text: "Failed password for root from 203.0.113.44 port 51208 ssh2", severity: "warn", group: "auth.log" },
  { id: "003", time: "02:14:09", source: "sshd[2241]", text: "Failed password for root from 203.0.113.44 port 51211 ssh2", severity: "warn", group: "auth.log" },
  { id: "004", time: "02:14:10", source: "sshd[2241]", text: "Failed password for admin from 203.0.113.44 port 51214 ssh2", severity: "warn", group: "auth.log" },
  { id: "005", time: "02:14:11", source: "sshd[2241]", text: "Failed password for admin from 203.0.113.44 port 51218 ssh2", severity: "warn", group: "auth.log" },
  { id: "006", time: "02:14:13", source: "sshd[2241]", text: "Failed password for deploy from 203.0.113.44 port 51224 ssh2", severity: "warn", group: "auth.log" },
  { id: "007", time: "02:14:55", source: "sshd[2249]", text: "Failed password for deploy from 203.0.113.44 port 51231 ssh2", severity: "warn", group: "auth.log" },
  { id: "008", time: "02:15:02", source: "sshd[2249]", text: "pam_unix(sshd:auth): 41 failures; possible brute force window", severity: "warn", group: "auth.log" },
  { id: "009", time: "02:15:48", source: "sshd[2261]", text: "Accepted password for deploy from 203.0.113.44 port 51204 ssh2", severity: "critical", group: "auth.log" },
  { id: "010", time: "02:15:48", source: "sshd[2261]", text: "pam_unix(sshd:session): session opened for user deploy by uid=0", severity: "critical", group: "auth.log" },
  { id: "011", time: "02:16:03", source: "sudo", text: "deploy : TTY=pts/0 ; PWD=/home/deploy ; COMMAND=/usr/bin/cat /etc/shadow", severity: "critical", group: "audit.log" },
  { id: "012", time: "02:16:31", source: "sshd[2261]", text: "subsystem request for sftp by user deploy", severity: "warn", group: "auth.log" },
  { id: "013", time: "03:02:11", source: "sshd[2410]", text: "Accepted publickey for j.reyes from 10.10.4.12 port 42192 ssh2", severity: "muted", group: "auth.log" },
  { id: "014", time: "03:18:44", source: "CRON[2510]", text: "pam_unix(cron:session): session closed for user root", severity: "muted", group: "audit.log" },
];
const KEY_EVIDENCE = ["008", "009", "010", "011"];
const RED_HERRINGS = ["013", "014"];
const HINTS = [
  "Brute-force noise is the opening act, not the incident. What changed after 02:15?",
  "Compare who logged in, from where, and what they touched sixty seconds later.",
  "Two later events look normal because they are. Not everything odd-hours is hostile.",
];
const OBJECTIVES = [
  { label: "Identify brute-force SSH patterns", check: (pins) => ["002", "003", "004", "005", "006", "007", "008"].some((id) => pins[id]) },
  { label: "Distinguish failed vs successful authentication", check: (pins) => !!pins["009"] },
  { label: "Recognize red herrings", check: (pins) => Object.keys(pins).length >= 3 && !RED_HERRINGS.some((id) => pins[id]) },
  { label: "Find evidence of compromise hidden in noise", check: (pins) => !!pins["010"] || !!pins["011"] },
];
const WS_DEBATES = {
  compromised: {
    challenge: "The /etc/shadow read came from an interactive sudo session. Administrators do that during maintenance windows. Why is this compromise and not routine ops?",
    defenses: [
      { id: "a", label: "Concede - it could be routine maintenance by the deploy account", win: false },
      { id: "b", label: "Hold - the password login succeeded 46s after 41 failures from 203.0.113.44; deploy normally uses keys", win: true },
    ],
  },
  inconclusive: {
    challenge: "You filed inconclusive, but you pinned a successful login after a 41-failure window and a credential-file read. Are you avoiding the call?",
    defenses: [
      { id: "a", label: "Concede - the chain is sufficient; revise to compromised", win: true },
      { id: "b", label: "Hold - without egress correlation, initial access is not proven", win: false },
    ],
  },
  benign: {
    challenge: "41 failed logins, a success from the same address, then a read of /etc/shadow - and your verdict is benign. Defend that.",
    defenses: [
      { id: "a", label: "Concede - this is a likely compromise", win: true },
      { id: "b", label: "Hold - brute-force noise is constant and admins read shadow", win: false },
    ],
  },
};
const AUTH_FEED = [
  { sev: "warn", text: "03:12:52 Accepted password for backup_svc after 2 failures" },
  { sev: "critical", text: "03:13:33 ALLOW TCP 10.20.14.88 -> 10.20.3.5:445" },
  { sev: "info", text: "03:41:19 Accepted publickey for jsmith" },
  { sev: "muted", text: "04:00:01 CMD /usr/local/bin/backup.sh - scheduled" },
  { sev: "warn", text: "03:44:10 POST 2.2MB to updates-cdn.example.com" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (event) => setReduced(event.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return reduced;
}

function useScrollReveal(reduced) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      }),
      { threshold: 0.16 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reduced]);
}

function useRollingRows(items, intervalMs, limit, reduced) {
  const [rows, setRows] = useState(() => items.slice(0, limit));
  useEffect(() => {
    if (reduced) return;
    let index = limit;
    const timer = setInterval(() => {
      setRows((current) => {
        const next = [...current, items[index % items.length]];
        index += 1;
        return next.slice(Math.max(0, next.length - limit));
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items, intervalMs, limit, reduced]);
  return rows;
}

function useCycleIndex(length, intervalMs, reduced) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % length), intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs, reduced]);
  return index;
}

function LogoMark({ size = 30, anim = false, className = "" }) {
  return (
    <span
      className={"logo-mark" + (anim ? " logo-anim" : "") + (className ? ` ${className}` : "")}
      style={{ "--logo-size": `${size}px` }}
      aria-hidden="true"
    >
      <img src={LOGO_MARK_SRC} alt="" className="logo-mark-img" draggable={false} />
    </span>
  );
}

function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Aftermath home">
      <LogoMark />
      <span className="brand-text">AFTER<span className="brand-ai">MATH</span></span>
    </button>
  );
}

function Kicker({ icon: Icon, children, tone = "amber" }) {
  return <span className={`kicker kicker-${tone}`}>{Icon && <Icon size={13} />} {children}</span>;
}

function PanelHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="ph">
      <span className="ph-icon"><Icon size={17} /></span>
      <span className="ph-text">
        <strong>{title}</strong>
        {subtitle && <span className="ph-sub mono">{subtitle}</span>}
      </span>
      {action && <span className="ph-action">{action}</span>}
    </div>
  );
}

function StatusChip({ tone = "cyan", icon: Icon, children }) {
  return <span className={`schip schip-${tone} mono`}>{Icon && <Icon size={12} />} {children}</span>;
}

function CaseStrip({ text }) {
  return (
    <div className="casestrip mono">
      <span className="case-dot soft-pulse" aria-hidden="true" />
      {text.map((item, index) => (
        <span key={index} className={item === "/" ? "case-sep" : ""}>{item}</span>
      ))}
    </div>
  );
}

function TriageDemo({ reduced, go }) {
  const [marks, setMarks] = useState(() => new Set());
  const [stage, setStage] = useState("marking");
  const [chalTyped, setChalTyped] = useState("");
  const [choice, setChoice] = useState(null);
  const [auto, setAuto] = useState(false);
  const timers = useRef([]);
  const q = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const reset = () => {
    clearTimers();
    setMarks(new Set());
    setStage("marking");
    setChalTyped("");
    setChoice(null);
    setAuto(false);
  };
  const toggleMark = (index) => {
    if (stage !== "marking" || auto) return;
    setMarks((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };
  const fileReport = () => {
    if (marks.size > 0 && stage === "marking") setStage("challenged");
  };
  useEffect(() => {
    if (stage !== "challenged") return;
    if (reduced) {
      setChalTyped(HERO_CHALLENGE);
      setStage("choosing");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setChalTyped(HERO_CHALLENGE.slice(0, i));
      if (i >= HERO_CHALLENGE.length) {
        clearInterval(id);
        setStage("choosing");
      }
    }, 22);
    timers.current.push(id);
    return () => clearInterval(id);
  }, [stage, reduced]);
  useEffect(() => {
    if (!auto || stage !== "choosing") return;
    q(() => {
      setChoice(HERO_DEFENSES[1]);
      setStage("scored");
    }, 1200);
  }, [auto, stage]);
  useEffect(() => () => clearTimers(), []);

  const playAuto = () => {
    reset();
    setAuto(true);
    q(() => setMarks(new Set([2])), 900);
    q(() => setMarks(new Set([2, 3])), 1700);
    q(() => setStage("challenged"), 2600);
  };
  const pick = (defense) => {
    if (stage === "choosing") {
      setChoice(defense);
      setStage("scored");
    }
  };
  const correct = [...marks].filter((index) => LOG_LINES[index].ev).length;
  const wrong = [...marks].filter((index) => !LOG_LINES[index].ev).length;
  const evScore = Math.max(0.1, Math.min(0.98, 0.3 + 0.31 * correct - 0.13 * wrong));
  const rsScore = choice?.win ? 0.87 : 0.41;
  const won = choice?.win && evScore >= 0.6;

  return (
    <div className="panel dark triage" aria-label="Playable investigation demo">
      <div className="triage-titlebar mono">
        <span className="triage-dot" aria-hidden="true" />
        <span className="triage-file">case://midnight-login - timed mode</span>
        <button className="triage-play mono" onClick={auto ? reset : playAuto}>{auto ? "■ STOP" : "▶ AUTOPLAY"}</button>
        <span className="triage-timer"><Clock3 size={11} /> 22:14</span>
      </div>
      {stage === "marking" && !auto && <div className="hint mono"><span className="hint-pulse">▲</span> THIS IS LIVE - CLICK THE LINES YOU'D MARK AS EVIDENCE</div>}
      <div className="triage-log scan-sweep">
        {LOG_LINES.map((line, index) => {
          let cls = "logline";
          if (stage === "marking" && !auto) cls += " logline-clickable";
          if (marks.has(index)) cls += " logline-evidence";
          if (stage === "scored") {
            if (line.ev && !marks.has(index)) cls += " logline-missed";
            if (!line.ev && marks.has(index)) cls += " logline-wrong";
          }
          return (
            <div key={index} className={cls} onClick={() => toggleMark(index)} role={stage === "marking" && !auto ? "button" : undefined} tabIndex={stage === "marking" && !auto ? 0 : undefined}>
              <span className="log-src mono">{line.src}</span>
              <span className="log-t mono">{line.t}</span>
              <span className="log-body mono">{line.body}</span>
              {marks.has(index) && <span className="log-tag mono">EVIDENCE</span>}
              {stage === "scored" && !line.ev && marks.has(index) && <span className="log-tag log-tag-red mono">RED HERRING</span>}
              {stage === "scored" && line.ev && !marks.has(index) && <span className="log-tag log-tag-dim mono">MISSED</span>}
            </div>
          );
        })}
      </div>
      {stage === "marking" && !auto && (
        <div className="triage-actions">
          <button className="btn btn-amber" onClick={fileReport} disabled={marks.size === 0}><FileKey size={15} /> File report - verdict: compromised</button>
          <span className="mono triage-count">{marks.size} MARKED</span>
        </div>
      )}
      {(stage === "challenged" || stage === "choosing" || stage === "scored") && (
        <div className="bubble on">
          <div className="bubble-head mono"><Scale size={12} /> AI ADVERSARY</div>
          <p>{chalTyped}<span className={"caret" + (stage === "challenged" ? " blink-cursor" : "")} /></p>
        </div>
      )}
      {stage === "choosing" && !auto && (
        <div className="defense-row">
          {HERO_DEFENSES.map((defense) => <button key={defense.id} className="defense-btn" onClick={() => pick(defense)}>{defense.label}</button>)}
        </div>
      )}
      {stage === "scored" && (
        <div className={"scorecard on" + (won ? "" : " scorecard-loss")}>
          <div className="scorecard-verdict mono">{won ? "CHALLENGE WITHDRAWN" : "CHALLENGE UPHELD - REVIEW THE MISSES"}</div>
          {[["EVIDENCE CHAIN", evScore], ["REASONING", rsScore]].map(([label, value]) => (
            <div key={label} className="scorebar-row mono">
              <span>{label}</span>
              <div className="scorebar"><div className="scorebar-fill" style={{ width: `${Math.round(value * 100)}%` }} /></div>
              <span className="score-n">{value.toFixed(2)}</span>
            </div>
          ))}
          <div className="score-actions">
            <button className="btn btn-ghostd btn-sm" onClick={reset}>Run it again</button>
            <button className="btn btn-amber btn-sm" onClick={() => go("workspace")}><LayoutDashboard size={13} /> Open the full workspace</button>
          </div>
        </div>
      )}
    </div>
  );
}

function sevClass(sev) {
  if (sev === "critical") return "ws-sev-critical";
  if (sev === "warn") return "ws-sev-warn";
  if (sev === "muted") return "ws-sev-muted";
  return "ws-sev-info";
}

function extractEntities(text) {
  const out = [];
  const ip = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  if (ip) out.push({ label: `ip ${ip[0]}`, tone: "danger" });
  const user = text.match(/for (\w[\w.]*) from/) || text.match(/user (\w[\w.]*)/) || text.match(/^(\w+) : TTY/);
  if (user) out.push({ label: `user ${user[1]}`, tone: "amber" });
  const service = text.match(/^(sshd|sudo|CRON)/i) ? text.split(/[[\s:]/)[0] : null;
  if (service) out.push({ label: `service ${service.toLowerCase()}`, tone: "cyan" });
  if (text.includes("/etc/shadow")) out.push({ label: "file /etc/shadow", tone: "violet" });
  return out;
}

function Workspace({ go, reduced }) {
  const [phase, setPhase] = useState("investigate");
  const [selectedId, setSelectedId] = useState("009");
  const [pins, setPins] = useState({});
  const [query, setQuery] = useState("");
  const [warnOnly, setWarnOnly] = useState(false);
  const [group, setGroup] = useState("all");
  const [seconds, setSeconds] = useState(42 * 60);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintOpen, setHintOpen] = useState(null);
  const [verdict, setVerdict] = useState("compromised");
  const [confidence, setConfidence] = useState(4);
  const [summary, setSummary] = useState("");
  const [chalTyped, setChalTyped] = useState("");
  const [chalDone, setChalDone] = useState(false);
  const [choice, setChoice] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    if (phase !== "investigate" && phase !== "report") return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const selected = useMemo(() => WS_ROWS.find((row) => row.id === selectedId) ?? WS_ROWS[8], [selectedId]);
  const filteredRows = useMemo(() => {
    const nq = query.trim().toLowerCase();
    return WS_ROWS.filter((row) => {
      const matchesQ = nq.length === 0 || `${row.time} ${row.source} ${row.text}`.toLowerCase().includes(nq);
      const matchesSev = !warnOnly || row.severity === "warn" || row.severity === "critical";
      const matchesGroup = group === "all" || row.group === group;
      return matchesQ && matchesSev && matchesGroup;
    });
  }, [query, warnOnly, group]);
  const pinCount = Object.keys(pins).length;
  const togglePin = (id) => {
    setPins((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { note: "", confidence: 3 };
      return next;
    });
  };
  const setPinField = (id, field, value) => setPins((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [field]: value } } : prev));
  const objectivesDone = OBJECTIVES.map((objective) => objective.check(pins));
  const entities = useMemo(() => {
    const seen = new Set();
    const out = [];
    Object.keys(pins).forEach((id) => {
      const row = WS_ROWS.find((item) => item.id === id);
      extractEntities(row.text).forEach((entity) => {
        if (!seen.has(entity.label)) {
          seen.add(entity.label);
          out.push(entity);
        }
      });
    });
    return out;
  }, [pins]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const debate = WS_DEBATES[verdict];

  useEffect(() => {
    if (phase !== "debate") return;
    if (reduced) {
      setChalTyped(debate.challenge);
      setChalDone(true);
      return;
    }
    setChalTyped("");
    setChalDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setChalTyped(debate.challenge.slice(0, i));
      if (i >= debate.challenge.length) {
        clearInterval(id);
        setChalDone(true);
      }
    }, 20);
    timers.current.push(id);
    return () => clearInterval(id);
  }, [phase, debate, reduced]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const revealHint = () => {
    if (hintsUsed >= HINTS.length) return;
    setHintOpen(HINTS[hintsUsed]);
    setHintsUsed((h) => h + 1);
  };
  const keyPinned = KEY_EVIDENCE.filter((id) => pins[id]).length;
  const herringsPinned = RED_HERRINGS.filter((id) => pins[id]).length;
  const evidenceScore = Math.max(0, Math.min(100, Math.round((keyPinned / KEY_EVIDENCE.length) * 100 - herringsPinned * 15)));
  const objectivesScore = Math.round((objectivesDone.filter(Boolean).length / OBJECTIVES.length) * 100);
  const reasoningScore = choice ? (choice.win ? 87 : 41) : 0;
  const total = Math.max(0, Math.round(evidenceScore * 0.45 + reasoningScore * 0.4 + objectivesScore * 0.15) - hintsUsed * 4);
  const passed = total >= 60;
  const resetAll = () => {
    setPhase("investigate");
    setPins({});
    setSelectedId("009");
    setQuery("");
    setWarnOnly(false);
    setGroup("all");
    setSeconds(42 * 60);
    setHintsUsed(0);
    setHintOpen(null);
    setVerdict("compromised");
    setConfidence(4);
    setSummary("");
    setChoice(null);
  };

  return (
    <div className="dark ws-shell">
      <CaseStrip text={["Case #SOC-2026-0447", "/", `phase: ${phase}`, "/", `evidence: ${pinCount} pinned`, "/", `timer ${mm}:${ss}`]} />
      <header className="nav">
        <Brand onClick={() => go("home")} />
        <span className="nav-tag mono">DEMO SESSION - NOTHING STORED</span>
        <div className="nav-auth"><button className="btn btn-ghost" onClick={() => go("home")}>Exit case</button></div>
      </header>
      <main className="page-in wrap ws">
        <div className="ws-head">
          <div className="ws-title">
            <span className="ph-icon ws-title-icon"><ShieldCheck size={21} /></span>
            <div><h1>SSH Reconnaissance</h1><p className="mono ws-sub">case://ssh-recon - timed mode · beginner</p></div>
          </div>
          <div className="ws-chips">
            <StatusChip tone="leaf">SESSION LIVE</StatusChip>
            <StatusChip tone="amber" icon={Lightbulb}>HINTS {HINTS.length - hintsUsed} / {HINTS.length}</StatusChip>
            <StatusChip tone={seconds < 300 ? "danger" : "amber"} icon={Timer}>{mm}:{ss} LEFT</StatusChip>
            {phase === "investigate" && <button className="btn btn-danger" onClick={() => setPhase("report")} disabled={pinCount === 0}><FileText size={15} /> Submit report</button>}
          </div>
        </div>

        {phase === "investigate" && (
          <div className="ws-grid">
            <aside className="ws-rail">
              <div className="panel pad-s">
                <PanelHeading icon={Terminal} title="Sources" subtitle="3 streams mounted" />
                <div className="ws-sources">
                  {[["all", WS_ROWS.length], ["auth.log", WS_ROWS.filter((r) => r.group === "auth.log").length], ["audit.log", WS_ROWS.filter((r) => r.group === "audit.log").length]].map(([source, count]) => (
                    <button key={source} className={"ws-source mono" + (group === source ? " ws-source-on" : "")} onClick={() => setGroup(source)}><span>{source}</span><span>{count}</span></button>
                  ))}
                </div>
              </div>
              <div className="panel pad-s">
                <PanelHeading icon={Check} title="Objectives" subtitle={`${objectivesDone.filter(Boolean).length} of ${OBJECTIVES.length} supported`} />
                <div className="ws-objectives">
                  {OBJECTIVES.map((objective, index) => <div key={objective.label} className="ws-obj"><span className={"ws-obj-box" + (objectivesDone[index] ? " ws-obj-done" : "")}>{objectivesDone[index] && <Check size={13} />}</span>{objective.label}</div>)}
                </div>
              </div>
              <div className="panel pad-s">
                <div className="ws-hint-head"><PanelHeading icon={Zap} title="Hint budget" subtitle={`${HINTS.length - hintsUsed} remaining`} /><strong className="mono ws-hint-n">{HINTS.length - hintsUsed}</strong></div>
                {hintOpen && <p className="ws-hint-text">{hintOpen}</p>}
                <button className="btn btn-ghost btn-block" onClick={revealHint} disabled={hintsUsed >= HINTS.length}><Zap size={14} /> Reveal hint (-4 pts)</button>
              </div>
            </aside>
            <div className="panel ws-logs">
              <div className="ws-logbar">
                <div className="ws-tools">
                  <label className="ws-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search logs..." className="mono" /></label>
                  <button className={"ws-toggle" + (warnOnly ? " ws-toggle-on" : "")} onClick={() => setWarnOnly((value) => !value)}>Warnings only</button>
                  <span className="mono ws-count">{filteredRows.length} VISIBLE</span>
                </div>
              </div>
              <div className="ws-logscroll">
                {filteredRows.map((row) => (
                  <div key={row.id} className={`ws-row ${sevClass(row.severity)} ${row.id === selectedId ? "ws-row-sel" : ""} ${pins[row.id] ? "ws-row-pin" : ""}`} onClick={() => setSelectedId(row.id)} role="button" tabIndex={0}>
                    <span className="mono ws-c-id">{Number(row.id)}</span>
                    <span className="mono ws-c-t">{row.time}</span>
                    <span className={"mono ws-c-src" + (row.severity === "warn" ? " c-amber" : " c-violet")}>{row.source}</span>
                    <span className="mono ws-c-text">{row.text}</span>
                    <button className={"ws-pinbtn mono" + (pins[row.id] ? " ws-pinbtn-on" : "")} onClick={(e) => { e.stopPropagation(); togglePin(row.id); }}>{pins[row.id] ? <><Check size={11} /> PINNED</> : <><Pin size={11} /> PIN</>}</button>
                  </div>
                ))}
              </div>
            </div>
            <aside className="ws-rail">
              <div className="panel pad-s">
                <PanelHeading icon={Pin} title="Evidence inspector" subtitle={`${pinCount} pinned`} />
                <div className="ws-inspect">
                  <div className="ws-inspect-meta mono"><span>{selected.group} - L{selected.id}</span><span>{selected.time}</span></div>
                  <p className="ws-inspect-text mono">{selected.text}</p>
                  {pins[selected.id] ? (
                    <>
                      <textarea className="ws-note" placeholder="Why does this line matter? This note goes in your report." value={pins[selected.id].note} onChange={(e) => setPinField(selected.id, "note", e.target.value)} />
                      <div className="ws-tags">{extractEntities(selected.text).map((tag) => <span key={tag.label} className={`ws-tag ws-tag-${tag.tone} mono`}>{tag.label}</span>)}</div>
                      <div className="ws-conf"><span>Confidence</span>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={"ws-dot" + (n <= pins[selected.id].confidence ? " ws-dot-on" : "")} onClick={() => setPinField(selected.id, "confidence", n)} aria-label={`Confidence ${n}`} />)}</div>
                    </>
                  ) : <button className="btn btn-ghost btn-block" onClick={() => togglePin(selected.id)}><Pin size={14} /> Pin as evidence</button>}
                </div>
              </div>
              <div className="panel pad-s">
                <PanelHeading icon={ShieldCheck} title="Suspicious entities" subtitle="extracted from pins" />
                <div className="ws-entities">{entities.length === 0 ? <p className="ws-entity-empty">Pin evidence to extract entities.</p> : entities.map((entity) => <div key={entity.label} className={`ws-entity ws-tag-${entity.tone} mono`}>{entity.label}</div>)}</div>
              </div>
            </aside>
          </div>
        )}

        {phase === "report" && (
          <div className="ws-narrow"><div className="panel pad">
            <PanelHeading icon={FileText} title="Incident report" subtitle={`${pinCount} evidence citations attached`} />
            <div className="ws-report">
              <div className="ws-field"><span className="ws-label">Verdict</span><div className="ws-verdicts">{[["compromised", "Compromised"], ["inconclusive", "Inconclusive"], ["benign", "Benign"]].map(([value, label]) => <button key={value} className={"ws-verdict" + (verdict === value ? " ws-verdict-on" : "")} onClick={() => setVerdict(value)}>{label}</button>)}</div></div>
              <div className="ws-field"><span className="ws-label">Confidence - {confidence}/5</span><div className="ws-conf ws-conf-lg">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={"ws-dot" + (n <= confidence ? " ws-dot-on" : "")} onClick={() => setConfidence(n)} aria-label={`Confidence ${n}`} />)}</div></div>
              <div className="ws-field"><span className="ws-label">Assessment summary</span><textarea className="ws-note ws-note-lg" placeholder="What happened, in your words. The adversary will read this." value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
              <div className="ws-cited">{Object.keys(pins).map((id) => <span key={id} className="ws-cite mono">L{id}</span>)}</div>
              <div className="ws-report-actions"><button className="btn btn-ghost" onClick={() => setPhase("investigate")}>Back to logs</button><button className="btn btn-danger" onClick={() => setPhase("debate")}><Scale size={15} /> File & face the adversary</button></div>
            </div>
          </div></div>
        )}

        {phase === "debate" && (
          <div className="ws-narrow"><div className="panel pad">
            <PanelHeading icon={Scale} title="Cross-examination" subtitle={`verdict on file: ${verdict}`} />
            <div className="bubble on ws-bubble"><div className="bubble-head mono"><Scale size={12} /> AI ADVERSARY</div><p>{chalTyped}<span className={"caret" + (!chalDone ? " blink-cursor" : "")} /></p></div>
            {chalDone && !choice && <div className="defense-row">{debate.defenses.map((defense) => <button key={defense.id} className="defense-btn" onClick={() => { setChoice(defense); setPhase("debrief"); }}>{defense.label}</button>)}</div>}
          </div></div>
        )}

        {phase === "debrief" && (
          <div className="ws-debrief">
            <div className="panel pad ws-scoretile"><div className={"ws-total" + (passed ? "" : " ws-total-low")}><span className="mono">{total}</span></div><h2>Overall score</h2><p className="ws-debrief-copy">{passed ? "Strong detection with a defensible evidence trail." : "The chain did not hold under pressure. Re-run the case and build the timeline before filing."}</p><div className="ws-badges"><StatusChip tone={passed ? "leaf" : "danger"} icon={passed ? BadgeCheck : XCircle}>{passed ? "PASSED" : "NOT YET"}</StatusChip><StatusChip tone="cyan">SCENARIO 1</StatusChip></div></div>
            <div className="panel pad"><PanelHeading icon={BarChart3} title="Breakdown" subtitle="calibrated rubric" /><div className="ws-metrics">{[["Evidence chain", evidenceScore, "leaf"], ["Reasoning under challenge", reasoningScore, choice?.win ? "leaf" : "danger"], ["Objectives supported", objectivesScore, "cyan"]].map(([label, value, tone]) => <div key={label} className="ws-metric"><div className="ws-metric-row mono"><span>{label}</span><span className={`c-${tone}`}>{value}</span></div><div className="scorebar"><div className={`scorebar-fill fill-${tone}`} style={{ width: `${value}%` }} /></div></div>)}</div></div>
            <div className="ws-rail"><div className="panel pad-s"><PanelHeading icon={AlertTriangle} title="Adversary's note" subtitle="from the debate" /><p className="ws-feedback">{choice?.win ? "Challenge withdrawn. The key-vs-password distinction and the 46-second gap were the load-bearing facts." : "Challenge upheld. The argument did not use the available timeline."}</p></div><div className="ws-debrief-actions"><button className="btn btn-ghost" onClick={resetAll}>Run the case again</button><button className="btn btn-amber" onClick={() => go("home")}><ArrowRight size={15} /> Back to base</button></div></div>
          </div>
        )}
      </main>
    </div>
  );
}

function Home({ go, reduced }) {
  useScrollReveal(reduced);
  const intake = useRollingRows(INTAKE_ROWS, 2400, 5, reduced);
  const stateIdx = useCycleIndex(STUDIO_STATES.length, 1600, reduced);
  const [openFaq, setOpenFaq] = useState(0);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  return (
    <>
      <CaseStrip text={["Case #SOC-2026-0447", "/", "status: investigation open", "/", "evidence items: 2 of 4 marked", "/", "adversary: standing by"]} />
      <header className="nav">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })} />
        <nav className="navpill" aria-label="Main">
          <button onClick={() => scrollTo("loop")}><Activity size={14} /> The Loop</button>
          <button onClick={() => go("workspace")}><LayoutDashboard size={14} /> Workspace</button>
          <button onClick={() => scrollTo("studio")}><WandSparkles size={14} /> Studio</button>
          <button onClick={() => scrollTo("faq")}><Database size={14} /> FAQ</button>
        </nav>
        <span className="nav-tag mono">EVIDENCE-FIRST INCIDENT TRAINING</span>
        <div className="nav-auth"><button className="btn btn-ghost" onClick={() => go("login")}><KeyRound size={15} /> Log in</button><button className="btn btn-amber" onClick={() => go("signup")}><UserPlus size={15} /> Start training</button></div>
      </header>
      <main className="page-in">
        <section className="wrap hero">
          <div className="hero-glow hero-glow-a" aria-hidden="true" />
          <div className="hero-glow hero-glow-b" aria-hidden="true" />
          <div className="panel hero-copy">
            <div className="hero-brand-row">
              <LogoMark size={86} className="hero-brand-mark" />
              <div>
                <span className="brand-text hero-brand-word">AFTER<span className="brand-ai">MATH</span></span>
                <span className="mono hero-brand-sub">INCIDENT TRAINING AFTER THE BREACH</span>
              </div>
            </div>
            <Kicker icon={Radio}>ADVERSARIAL · SOC · SIMULATOR</Kicker>
            <h1>The intrusion already happened. <span className="h1-grad">You have until dawn.</span></h1>
            <p className="hero-sub">Aftermath drops junior analysts into the seat of a real Security Operations Center after a breach. Triage authentic log evidence under timed pressure, build a defensible report, and find out line by line whether you would have caught the adversary.</p>
            <div className="hero-ctas"><button className="btn btn-amber btn-lg" onClick={() => go("workspace")}><Play size={16} /> Open the demo case</button><button className="btn btn-ghost btn-lg" onClick={() => scrollTo("loop")}>See the loop</button></div>
            <p className="hero-trust mono">OPEN SOURCE · RUNS ON A LAPTOP · ALL SCENARIO DATA SYNTHETIC</p>
          </div>
          <div><TriageDemo reduced={reduced} go={go} /><p className="demo-note mono">THE ACTUAL PRODUCT LOOP - NOT A VIDEO</p></div>
        </section>
        <section className="wrap" data-reveal><div className="panel dark intake"><PanelHeading icon={Server} title="Live intake" subtitle="synthetic feed · rolling" action={<span className="status-chip mono"><span className="case-dot soft-pulse" /> STREAMING</span>} /><div className="intake-rows">{intake.map((row, i) => <div key={`${row.text}-${i}`} className={`intake-row mono sev-${row.sev}`}>{row.text}</div>)}</div></div></section>
        <section className="wrap section" id="loop"><Kicker icon={Activity} tone="cyan">THE LOOP</Kicker><h2 data-reveal>How an investigation runs</h2><div className="steps">{STEPS.map((step, i) => <article key={step.title} className="panel step" data-reveal style={{ transitionDelay: reduced ? "0ms" : `${i * 100}ms` }}><span className="ph-icon"><step.icon size={17} /></span><h3>{step.title}</h3><p>{step.body}</p><div className="step-meta mono">{step.meta}</div></article>)}</div></section>
        <section className="wrap section"><Kicker icon={GitBranch} tone="cyan">WHY IT'S DIFFERENT</Kicker><h2 data-reveal>Trained the way the work actually is</h2><div className="panel table-panel" data-reveal><div className="crow crow-head mono"><span>DIMENSION</span><span>TRADITIONAL TRAINING</span><span className="ccyan">AFTERMATH</span></div>{COMPARISON_ROWS.map((row) => <div key={row[0]} className="crow"><span className="cdim">{row[0]}</span><span className="cold">{row[1]}</span><span className="cnew">{row[2]}</span></div>)}</div></section>
        <section className="wrap section" id="studio"><Kicker icon={WandSparkles} tone="cyan">SCENARIO STUDIO</Kicker><h2 data-reveal>Fresh cases from live threat intelligence</h2><div className="split"><div className="panel pad" data-reveal><PanelHeading icon={GitBranch} title="Review pipeline" subtitle="the AI never publishes directly" /><div className="states">{STUDIO_STATES.map((state, i) => <span key={state} className={"state mono" + (i === stateIdx ? " state-on review-active" : i < stateIdx ? " state-done" : "")}>{state}</span>)}</div><p className="panel-body">Every scenario moves through safety screening, quality review, and human approval before it reaches the catalog.</p></div><div className="panel pad" data-reveal><PanelHeading icon={Database} title="Threat sources" subtitle="public · structured · cached" /><div className="sources">{THREAT_SOURCES.map((source) => <div key={source[0]} className="source-row"><span className="source-name mono">{source[0]}</span><span className="source-desc">{source[1]}</span><span className="source-cad mono">{source[2]}</span></div>)}</div></div></div></section>
        <section className="wrap section" id="safety"><Kicker icon={ShieldCheck} tone="cyan">SAFETY MODEL</Kicker><h2 data-reveal>Describe attacks. Never instruct them.</h2><div className="trio">{SAFETY_RULES.map((rule, i) => <article key={rule.title} className={`panel pad rule rule-${rule.tone}`} data-reveal style={{ transitionDelay: reduced ? "0ms" : `${i * 100}ms` }}><div className={`rule-head rule-head-${rule.tone}`}><rule.icon size={16} /> <strong>{rule.title}</strong></div><p>{rule.body}</p></article>)}</div></section>
        <section className="wrap section"><Kicker icon={Zap} tone="cyan">BUILD LOG</Kicker><h2 data-reveal>Shipping in the open</h2><div className="panel table-panel" data-reveal>{ROADMAP_ROWS.map((row) => <div key={row[0]} className="rrow"><span className="rm mono">{row[0]}</span><span className="rt">{row[1]}</span><span className="rd">{row[2]}</span></div>)}</div></section>
        <section className="wrap section" id="faq"><Kicker icon={Database} tone="cyan">QUESTIONS</Kicker><h2 data-reveal>Asked before you file</h2><div className="faq" data-reveal>{FAQS.map((item, i) => <div key={item.q} className={"faq-item" + (openFaq === i ? " faq-open" : "")}><button className="faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}><span>{item.q}</span><span className="faq-chev mono">{openFaq === i ? "-" : "+"}</span></button><div className="faq-a"><p>{item.a}</p></div></div>)}</div></section>
        <section className="wrap finale" data-reveal><div className="panel dark finale-inner"><div className="finale-glow" aria-hidden="true" /><LogoMark size={74} className="finale-mark" /><Kicker icon={Radio}>CLEARANCE NOT REQUIRED</Kicker><h2>Your first case is waiting.</h2><p className="finale-sub">Free while in beta. Bring skepticism.</p><button className="btn btn-amber btn-lg" onClick={() => go("workspace")}><Play size={16} /> Open a case file</button></div></section>
      </main>
      <footer className="footer"><div className="wrap footer-row"><Brand onClick={() => window.scrollTo({ top: 0 })} /><p className="mono footer-note">(c) 2026 Aftermath Labs - v0.8 prototype · all data synthetic</p><div className="footer-links"><button onClick={() => scrollTo("safety")}>Security</button><button onClick={() => scrollTo("faq")}>Docs</button><button onClick={() => go("signup")}>Contact</button></div></div></footer>
    </>
  );
}

const AUTH_FEATURES = [
  { icon: Timer, title: "Timed investigations", body: "Fragmented multi-source logs under a live clock." },
  { icon: Scale, title: "AI cross-examination", body: "Defend your verdict against a devil's advocate." },
  { icon: Server, title: "Ephemeral labs", body: "A live host in your browser. Isolated. Self-destructs." },
];

function AuthSide({ reduced }) {
  const feed = useRollingRows(AUTH_FEED, 2600, 3, reduced);
  return (
    <div className="panel dark auth-side">
      <div className="auth-side-brand"><LogoMark size={56} anim={!reduced} /><div><span className="brand-text auth-side-word">AFTER<span className="brand-ai">MATH</span></span><span className="mono auth-side-tag">CLASSIFIED TRAINING ENVIRONMENT</span></div></div>
      <p className="auth-side-copy">The intrusion already happened. You have until dawn.</p>
      <div className="auth-feed"><div className="auth-feed-head mono"><span className="case-dot soft-pulse" /> LIVE INTAKE - SYNTHETIC</div>{feed.map((row, i) => <div key={`${row.text}-${i}`} className={`intake-row mono sev-${row.sev}`}>{row.text}</div>)}</div>
      <div className="auth-features">{AUTH_FEATURES.map((feature) => <div key={feature.title} className="auth-feature"><span className="ph-icon"><feature.icon size={15} /></span><div><strong>{feature.title}</strong><p>{feature.body}</p></div></div>)}</div>
      <div className="auth-status mono"><span className="astat"><span className="astat-dot" /> API OPERATIONAL</span><span className="astat"><span className="astat-dot" /> LAB POOL WARM</span><span className="astat"><span className="astat-dot" /> STUDIO SYNCED</span></div>
      <p className="mono auth-side-foot">RFC 1918 ONLY · ALL DATA SYNTHETIC · NOTHING STORED IN THIS PROTOTYPE</p>
    </div>
  );
}

function AuthShell({ go, reduced, icon: Icon, eyebrow, h1, sub, children }) {
  return (
    <div className="auth-wrap">
      <CaseStrip text={["Case #SOC-2026-0447", "/", "status: investigation open", "/", "adversary: standing by"]} />
      <header className="nav nav-auth-page"><Brand onClick={() => go("home")} /><div className="nav-auth"><button className="btn btn-ghost" onClick={() => go("home")}>Back to base</button></div></header>
      <main className="auth-main page-in wrap"><AuthSide reduced={reduced} /><div className="panel auth-card"><span className="ph-icon auth-icon"><Icon size={18} /></span><p className="kicker kicker-cyan auth-kicker">{eyebrow}</p><h1 className="auth-h1">{h1}</h1>{sub && <p className="auth-sub">{sub}</p>}{children}</div></main>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, autoComplete, hint, error, placeholder }) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="field"><label htmlFor={id}>{label}</label><div className={"field-box" + (error ? " field-err" : "")}><input id={id} type={isPw && show ? "text" : type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />{isPw && <button type="button" className="field-toggle mono" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? "HIDE" : "SHOW"}</button>}</div>{error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}</div>
  );
}

function useMockSubmit() {
  const [state, setState] = useState("idle");
  const submit = () => {
    setState("busy");
    setTimeout(() => setState("done"), 900);
  };
  return [state, submit];
}

function AuthDone({ go }) {
  return <div className="proto-notice" role="status">Prototype build - real accounts land in Milestone 1. Nothing was sent or stored.<button className="btn btn-amber btn-block" onClick={() => go("workspace")}><LayoutDashboard size={15} /> Enter the demo workspace</button><button className="btn btn-ghost btn-block" onClick={() => go("home")}>Back to home</button></div>;
}

function SsoRow({ onPick }) {
  return <><div className="divider mono"><span>OR</span></div><div className="sso-row"><button type="button" className="btn btn-ghost sso-btn" onClick={onPick}><Github size={15} /> Continue with GitHub</button><button type="button" className="btn btn-ghost sso-btn" onClick={onPick}><Globe size={15} /> Continue with Google</button></div></>;
}

function Login({ go, reduced }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [forgot, setForgot] = useState(false);
  const [state, submit] = useMockSubmit();
  const onSubmit = (event) => {
    event.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address.";
    if (pw.length === 0) errs.pw = "Password is required.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) submit();
  };
  return (
    <AuthShell go={go} reduced={reduced} icon={KeyRound} eyebrow="WELCOME BACK" h1="Log in" sub="Pick up the case where you left it.">
      {state === "done" ? <AuthDone go={go} /> : <form onSubmit={onSubmit} className="auth-form" noValidate><Field id="li-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="analyst@example.com" error={errors.email} /><Field id="li-pw" label="Password" type="password" value={pw} onChange={setPw} autoComplete="current-password" error={errors.pw} /><div className="auth-row"><label className="checkline"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span className="checkbox" aria-hidden="true">{remember && <Check size={12} />}</span>Remember this device</label><button type="button" className="link" onClick={() => setForgot(true)}>Forgot password?</button></div>{forgot && <p className="inline-note mono">PASSWORD RESET SHIPS WITH M1 ACCOUNTS - THIS PROTOTYPE STORES NOTHING TO RESET.</p>}<button className="btn btn-amber btn-block" disabled={state === "busy"}>{state === "busy" ? "Checking..." : "Log in"}</button><SsoRow onPick={submit} /><p className="auth-alt">New here? <button type="button" className="link" onClick={() => go("signup")}>Create an account</button></p></form>}
    </AuthShell>
  );
}

const EXPERIENCE = ["Student", "Junior analyst", "SOC professional"];
function pwScore(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, pw.length === 0 ? 0 : Math.max(1, score - 1));
}
const PW_LABELS = ["", "WEAK", "FAIR", "STRONG", "FORTIFIED"];
const PW_TONES = ["", "danger", "amber", "leaf", "leaf"];
function StrengthMeter({ pw }) {
  const score = pwScore(pw);
  if (!pw) return null;
  return <div className="pwmeter"><div className="pwsegs">{[1, 2, 3, 4].map((n) => <span key={n} className={"pwseg" + (n <= score ? ` pwseg-${PW_TONES[score]}` : "")} />)}</div><span className={`mono pwlabel c-${PW_TONES[score]}`}>{PW_LABELS[score]}</span></div>;
}

function Signup({ go, reduced }) {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [level, setLevel] = useState("Student");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [state, submit] = useMockSubmit();
  const onSubmit = (event) => {
    event.preventDefault();
    const errs = {};
    if (handle.trim().length < 3) errs.handle = "Handle needs at least 3 characters.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address.";
    if (pw.length < 8) errs.pw = "Use at least 8 characters.";
    if (!terms) errs.terms = "You'll need to accept the range rules.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) submit();
  };
  return (
    <AuthShell go={go} reduced={reduced} icon={UserPlus} eyebrow="JOIN THE RANGE" h1="Create your account" sub="Three fields between you and your first case.">
      {state === "done" ? <AuthDone go={go} /> : <form onSubmit={onSubmit} className="auth-form" noValidate><Field id="su-handle" label="Analyst handle" value={handle} onChange={setHandle} autoComplete="username" placeholder="nightshift_04" hint="How you'll appear on scoreboards and incident reports." error={errors.handle} /><Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="analyst@example.com" error={errors.email} /><div><Field id="su-pw" label="Password" type="password" value={pw} onChange={setPw} autoComplete="new-password" error={errors.pw} /><StrengthMeter pw={pw} /></div><div className="field"><label>Experience level</label><div className="seg-row">{EXPERIENCE.map((item) => <button key={item} type="button" className={"seg" + (level === item ? " seg-on" : "")} onClick={() => setLevel(item)}>{item}</button>)}</div><p className="field-hint">Calibrates the difficulty of your first cases.</p></div><div><label className="checkline"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="checkbox" aria-hidden="true">{terms && <Check size={12} />}</span>I accept the range rules: synthetic data only, no real targets.</label>{errors.terms && <p className="field-error">{errors.terms}</p>}</div><button className="btn btn-amber btn-block" disabled={state === "busy"}>{state === "busy" ? "Provisioning..." : "Create account"}</button><SsoRow onPick={submit} /><p className="auth-alt">Already have one? <button type="button" className="link" onClick={() => go("login")}>Log in</button></p></form>}
    </AuthShell>
  );
}

export default function AftermathPrototype() {
  const [view, setView] = useState("home");
  const reduced = useReducedMotion();
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  return (
    <div className="cr-root">
      <style>{CSS}</style>
      <div className="above">
        {view === "home" && <Home go={setView} reduced={reduced} />}
        {view === "login" && <Login go={setView} reduced={reduced} />}
        {view === "signup" && <Signup go={setView} reduced={reduced} />}
        {view === "workspace" && <Workspace go={setView} reduced={reduced} />}
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
.cr-root{--bg:#F5F9FA;--panel:#FFFFFF;--well:#EDF4F6;--line:#DEE9EC;--line2:#C2D7DC;--text:#0D222B;--muted:#56707B;--cyan:#0E9C90;--amber:#F2A93B;--danger:#E0424D;--violet:#6B6DE0;--leaf:#0FA36B;--navbg:rgba(255,255,255,.88);--chipbg:#F0F7F8;--shadow:0 18px 55px rgba(13,34,43,.08);--mono:'SFMono-Regular',Consolas,'Liberation Mono',monospace;position:relative;min-height:100vh;background:radial-gradient(circle at 85% -5%,rgba(14,156,144,.08),transparent 34%),radial-gradient(circle at -5% 30%,rgba(242,169,59,.07),transparent 30%),linear-gradient(180deg,#FBFDFD 0%,#F5F9FA 40%,#F1F6F8 100%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.6}
.cr-root .dark{--panel:rgba(11,19,24,.92);--well:rgba(3,6,7,.65);--line:#1d3038;--line2:#274651;--text:#eef7f8;--muted:#98a9b2;--cyan:#5ee7dc;--danger:#ff4f58;--violet:#8c8dff;--leaf:#72e6a3;--navbg:rgba(3,6,7,.92);--chipbg:rgba(3,6,7,.65);--shadow:0 18px 55px rgba(0,0,0,.3);color:var(--text)}
.cr-root *,.cr-root *::before,.cr-root *::after{box-sizing:border-box}.cr-root h1,.cr-root h2,.cr-root h3{margin:0;font-weight:900;line-height:1.15;letter-spacing:-.01em}.cr-root p{margin:0}.cr-root button{font:inherit;cursor:pointer}.cr-root button:disabled{cursor:not-allowed;opacity:.62}.cr-root textarea{font:inherit;resize:vertical}.cr-root :focus-visible{outline:2px solid rgba(14,156,144,.6);outline-offset:2px;border-radius:4px}.mono{font-family:var(--mono)}.c-leaf{color:var(--leaf)}.c-danger{color:var(--danger)}.c-cyan{color:var(--cyan)}.c-amber{color:#C97C00}.dark .c-amber{color:var(--amber)}.c-violet{color:var(--violet)}.above{position:relative;z-index:1}.wrap{width:calc(100% - 2rem);max-width:1440px;margin:0 auto}.section{padding-top:clamp(48px,8vh,88px)}.section h2{font-size:clamp(24px,3vw,36px);margin-top:14px;max-width:26ch;text-wrap:balance}.page-in{animation:pageIn .38s cubic-bezier(.2,.7,.3,1) both}@keyframes pageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}[data-reveal]{opacity:0;transform:translateY(14px);transition:opacity .5s cubic-bezier(.2,.7,.3,1),transform .5s cubic-bezier(.2,.7,.3,1)}[data-reveal].in{opacity:1;transform:none}
.casestrip{display:flex;align-items:center;gap:10px;overflow:hidden;border-bottom:1px solid var(--line);background:var(--navbg);padding:8px 0 8px max(1rem,calc((100% - 1440px)/2));font-size:.68rem;text-transform:uppercase;letter-spacing:.16em;color:var(--muted);white-space:nowrap}.case-sep{color:var(--line2)}.case-dot{display:inline-block;width:8px;height:8px;border-radius:999px;background:var(--amber);flex:0 0 auto}.soft-pulse{animation:softPulse 2.4s ease-in-out infinite}@keyframes softPulse{0%,100%{opacity:.64;box-shadow:0 0 0 0 rgba(242,169,59,.32)}50%{opacity:1;box-shadow:0 0 0 6px rgba(242,169,59,0)}}.nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:16px;min-height:70px;padding:0 max(1rem,calc((100% - 1440px)/2));border-bottom:1px solid var(--line);background:var(--navbg);backdrop-filter:blur(18px)}.brand{display:flex;align-items:center;gap:10px;background:none;border:none;padding:6px;border-radius:8px;color:var(--text)}.logo-mark{display:grid;place-items:center;width:var(--logo-size);height:var(--logo-size);flex:0 0 auto;overflow:hidden;border-radius:8px;border:1px solid rgba(14,156,144,.18);background:#fff;box-shadow:0 8px 22px rgba(13,34,43,.08),0 0 24px rgba(14,156,144,.12)}.logo-mark-img{display:block;width:118%;height:118%;object-fit:cover;transform:translateY(1px);user-select:none}.dark .logo-mark{border-color:rgba(94,231,220,.22);box-shadow:0 10px 30px rgba(0,0,0,.34),0 0 24px rgba(94,231,220,.16)}.logo-anim .logo-mark-img{animation:logoBreathe 4.2s ease-in-out infinite}@keyframes logoBreathe{0%,100%{transform:translateY(1px) scale(1)}50%{transform:translateY(1px) scale(1.035)}}.brand-text{font-weight:900;letter-spacing:.05em;font-size:15px}.brand-ai{color:var(--cyan)}.navpill{display:flex;gap:4px;padding:4px;border-radius:8px;border:1px solid var(--line);background:var(--chipbg)}.navpill button{display:flex;align-items:center;gap:7px;background:none;border:none;border-radius:6px;color:var(--muted);font-size:13.5px;font-weight:700;padding:8px 12px}.navpill button:hover{color:var(--text);background:var(--panel)}.nav-tag{display:none;font-size:.66rem;text-transform:uppercase;letter-spacing:.22em;color:var(--muted);margin-left:auto}.nav-auth{margin-left:auto;display:flex;gap:10px}@media (min-width:1240px){.nav-tag{display:block}.nav-auth{margin-left:0}}
.btn{display:inline-flex;align-items:center;gap:8px;justify-content:center;font-weight:800;font-size:14px;border-radius:8px;padding:10px 16px;border:1px solid transparent;transition:transform .14s ease,box-shadow .2s ease,background .15s ease,border-color .15s ease,color .15s ease}.btn-lg{font-size:15px;padding:12px 20px}.btn-sm{font-size:12.5px;padding:7px 12px}.btn-amber{background:linear-gradient(100deg,var(--amber),#F28E3B);color:#241300;box-shadow:0 6px 20px rgba(242,141,59,.28)}.btn-amber:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(242,141,59,.36)}.btn-danger{background:var(--danger);color:#fff}.btn-ghost,.btn-ghostd{background:transparent;color:var(--text);border-color:var(--line2)}.btn-ghost:hover,.btn-ghostd:hover{border-color:var(--cyan);color:var(--cyan);box-shadow:0 0 28px rgba(14,156,144,.12)}.btn-block{width:100%;margin-top:6px}.kicker{display:inline-flex;align-items:center;gap:8px;border-radius:6px;border:1px solid;padding:6px 12px;font-family:var(--mono);font-size:.68rem;text-transform:uppercase;letter-spacing:.18em}.kicker-amber{color:#C97C00;border-color:rgba(201,124,0,.35);background:rgba(242,169,59,.1)}.dark .kicker-amber{color:var(--amber);border-color:rgba(242,169,59,.3);background:rgba(242,169,59,.08)}.kicker-cyan{color:var(--cyan);border-color:rgba(14,156,144,.35);background:rgba(14,156,144,.08)}.panel{border-radius:12px;border:1px solid var(--line);background:var(--panel);box-shadow:var(--shadow)}.pad{padding:22px}.pad-s{padding:18px}.panel-body{color:var(--muted);font-size:14px;line-height:1.7;margin-top:16px}.ph{display:flex;align-items:center;gap:12px}.ph-icon{display:grid;place-items:center;width:36px;height:36px;flex:0 0 auto;border-radius:8px;border:1px solid var(--line2);background:var(--chipbg);color:var(--cyan)}.ph-text strong{display:block;font-size:14px;font-weight:900}.ph-sub{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}.ph-action{margin-left:auto}.status-chip{display:inline-flex;align-items:center;gap:8px;font-size:.64rem;letter-spacing:.18em;color:var(--amber)}.schip{display:inline-flex;align-items:center;gap:6px;border:1px solid;border-radius:6px;padding:6px 10px;font-size:.64rem;letter-spacing:.14em;text-transform:uppercase}.schip-leaf{color:var(--leaf);border-color:rgba(15,163,107,.4);background:rgba(15,163,107,.08)}.schip-amber{color:#C97C00;border-color:rgba(201,124,0,.4);background:rgba(242,169,59,.1)}.dark .schip-amber{color:var(--amber)}.schip-danger{color:var(--danger);border-color:rgba(224,66,77,.45);background:rgba(224,66,77,.08)}.schip-cyan{color:var(--cyan);border-color:rgba(14,156,144,.4);background:rgba(14,156,144,.07)}
.hero{position:relative;display:grid;grid-template-columns:1.02fr .98fr;gap:24px;padding-top:34px;align-items:start}.hero-glow{position:absolute;pointer-events:none;border-radius:50%}.hero-glow-a{right:-4%;top:-6%;width:50%;height:70%;background:radial-gradient(closest-side,rgba(242,169,59,.14),transparent 70%)}.hero-glow-b{left:-6%;bottom:-10%;width:44%;height:60%;background:radial-gradient(closest-side,rgba(14,156,144,.12),transparent 70%)}.hero-copy{padding:28px;position:relative}.hero-brand-row{display:flex;align-items:center;gap:16px;margin-bottom:18px}.hero-brand-mark{border-radius:18px;border-color:rgba(14,156,144,.22);box-shadow:0 18px 44px rgba(13,34,43,.12),0 0 44px rgba(14,156,144,.16)}.hero-brand-word{display:block;font-size:26px;letter-spacing:.08em;line-height:1}.hero-brand-sub{display:block;margin-top:7px;font-size:.62rem;letter-spacing:.2em;color:var(--muted)}.hero h1{margin-top:22px;font-size:clamp(28px,3.4vw,46px);text-wrap:balance;max-width:24ch}.h1-grad{background:linear-gradient(95deg,var(--cyan) 0%,#C97C00 90%);-webkit-background-clip:text;background-clip:text;color:transparent}.hero-sub{margin-top:18px;color:var(--muted);font-size:15.5px;line-height:1.8;max-width:58ch}.hero-ctas{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}.hero-trust{margin-top:22px;font-size:.66rem;letter-spacing:.16em;color:var(--muted)}.demo-note{text-align:center;margin-top:10px;font-size:.62rem;letter-spacing:.18em;color:var(--muted)}
.triage{overflow:hidden}.triage-titlebar{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--line);font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}.triage-dot{width:8px;height:8px;border-radius:999px;background:var(--danger);animation:softPulse 1.8s ease-in-out infinite}.triage-file{text-transform:none;letter-spacing:.04em}.triage-play{margin-left:auto;background:none;border:1px solid var(--line2);border-radius:5px;color:var(--muted);font-size:.6rem;letter-spacing:.14em;padding:4px 8px}.triage-timer{display:inline-flex;align-items:center;gap:5px;color:var(--amber)}.hint{display:flex;align-items:center;gap:8px;padding:10px 16px 0;font-size:.62rem;letter-spacing:.16em;color:var(--amber)}.scan-sweep{background-image:repeating-linear-gradient(180deg,rgba(255,255,255,.022) 0,rgba(255,255,255,.022) 1px,transparent 1px,transparent 3px);animation:sweep 6s linear infinite}@keyframes sweep{from{background-position:0 0}to{background-position:0 -60px}}.triage-log{padding:10px 12px 6px}.logline{display:flex;align-items:baseline;gap:10px;font-size:11.5px;line-height:2;padding:0 8px;border-radius:5px;border:1px solid transparent;border-left-width:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.logline-clickable{cursor:pointer}.logline-clickable:hover{background:rgba(94,231,220,.06)}.log-src{color:var(--cyan);flex:0 0 58px}.log-t{color:var(--muted)}.log-body{color:rgba(224,242,254,.85);overflow:hidden;text-overflow:ellipsis}.logline-evidence{background:rgba(242,169,59,.09);border-left-color:var(--amber)}.logline-missed{border-left-color:var(--amber);border-left-style:dashed}.logline-wrong{background:rgba(255,79,88,.1);border-left-color:var(--danger)}.log-tag{margin-left:auto;font-size:.58rem;letter-spacing:.14em;color:var(--amber);border:1px solid rgba(242,169,59,.5);border-radius:4px;padding:0 6px;animation:stamp .32s cubic-bezier(.2,1.4,.4,1)}.log-tag-red{color:var(--danger);border-color:rgba(255,79,88,.5)}.log-tag-dim{color:var(--muted);border-color:var(--line2);animation:none}@keyframes stamp{from{transform:scale(1.7);opacity:0}to{transform:scale(1);opacity:1}}.triage-actions{display:flex;align-items:center;gap:14px;padding:10px 16px 16px}.triage-count{font-size:.62rem;letter-spacing:.16em;color:var(--muted)}.bubble{margin:8px 12px 0;padding:12px 14px;border-radius:8px;font-size:13px;background:var(--well);border:1px solid rgba(242,169,59,.4);opacity:0;transform:translateY(6px);transition:opacity .4s ease,transform .4s ease}.bubble.on{opacity:1;transform:none}.bubble-head{display:flex;align-items:center;gap:6px;font-size:.62rem;letter-spacing:.2em;color:var(--amber);margin-bottom:6px;text-transform:uppercase}.bubble p{color:rgba(224,242,254,.86);line-height:1.7}.caret{display:inline-block;width:7px;height:13px;vertical-align:-2px;background:transparent}.blink-cursor{background:var(--amber);animation:blink 1s steps(1) infinite}@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}.defense-row{display:flex;flex-direction:column;gap:8px;padding:10px 12px 12px}.defense-btn{text-align:left;background:var(--well);border:1px solid var(--line2);border-radius:7px;color:var(--text);font-size:13px;padding:10px 14px}.defense-btn:hover{border-color:var(--cyan);transform:translateX(3px);box-shadow:0 0 34px rgba(94,231,220,.12)}.scorecard{margin:12px;padding:14px;border-radius:8px;background:rgba(114,230,163,.07);border:1px solid rgba(114,230,163,.4);opacity:0;transform:translateY(6px);transition:opacity .45s ease,transform .45s ease}.scorecard.on{opacity:1;transform:none}.scorecard-loss{background:rgba(255,79,88,.07);border-color:rgba(255,79,88,.4)}.scorecard-verdict{font-size:.66rem;letter-spacing:.18em;color:var(--leaf);margin-bottom:10px;text-transform:uppercase}.scorecard-loss .scorecard-verdict,.scorecard-loss .score-n{color:var(--danger)}.scorebar-row{display:flex;align-items:center;gap:10px;font-size:.6rem;color:var(--muted);margin-top:6px;letter-spacing:.1em}.scorebar-row>span:first-child{flex:0 0 106px}.scorebar{flex:1;height:5px;background:rgba(3,6,7,.8);border-radius:3px;overflow:hidden}.scorebar-fill{height:100%;background:var(--leaf);border-radius:3px;transition:width 1.1s cubic-bezier(.2,.8,.2,1) .15s}.scorecard-loss .scorebar-fill{background:var(--danger)}.fill-leaf{background:var(--leaf)}.fill-danger{background:var(--danger)}.fill-cyan{background:var(--cyan)}.score-n{color:var(--leaf)}.score-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.intake{padding:18px 20px;margin-top:24px}.intake-rows{margin-top:14px;display:grid;gap:4px}.intake-row{font-size:11.5px;line-height:1.9;padding:2px 10px;border-radius:5px;border:1px solid transparent;border-left-width:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:pageIn .4s ease both}.sev-critical{border-color:rgba(255,79,88,.5);background:rgba(255,79,88,.08);color:#ffd7d9}.sev-warn{border-left-color:rgba(242,169,59,.5);color:var(--amber)}.sev-info{border-left-color:transparent;color:rgba(224,242,254,.8)}.sev-muted{border-left-color:transparent;color:#64748b}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:30px}.step{padding:22px}.step:hover{transform:translateY(-4px);box-shadow:0 22px 50px rgba(13,34,43,.12)}.step h3{font-size:16.5px;margin-top:16px}.step p{color:var(--muted);font-size:13.5px;line-height:1.7;margin-top:8px}.step-meta{margin-top:14px;font-size:.62rem;letter-spacing:.14em;color:var(--cyan);text-transform:uppercase}.table-panel{margin-top:30px;padding:8px 22px}.crow{display:grid;grid-template-columns:.8fr 1fr 1fr;gap:16px;padding:13px 0;border-top:1px solid var(--line);font-size:14px;align-items:baseline}.crow:first-child{border-top:none}.crow-head{font-size:.64rem;letter-spacing:.18em;color:var(--muted);text-transform:uppercase}.ccyan{color:var(--cyan)}.cdim{font-weight:700}.cold{color:var(--muted)}.cnew{color:var(--text);font-weight:500}.split{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:30px}.states{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.state{font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--line2);border-radius:5px;padding:5px 10px;color:var(--muted);font-family:var(--mono)}.state-on{color:#C97C00}.review-active{animation:activeReview 2.2s ease-in-out infinite}@keyframes activeReview{0%,100%{border-color:rgba(242,169,59,.3);background-color:rgba(242,169,59,.06)}50%{border-color:rgba(242,169,59,.6);background-color:rgba(242,169,59,.12)}}.state-done{color:var(--leaf);border-color:rgba(15,163,107,.4)}.sources{margin-top:16px;display:grid}.source-row{display:grid;grid-template-columns:150px 1fr 44px;gap:14px;align-items:baseline;padding:11px 0;border-top:1px solid var(--line);font-size:13px}.source-row:first-child{border-top:none}.source-name{color:var(--cyan);font-size:11.5px}.source-desc{color:var(--muted)}.source-cad{color:#C97C00;font-size:11px;text-align:right}.trio{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}.rule{border-top-width:4px}.rule p{color:var(--muted);font-size:13.5px;line-height:1.7;margin-top:12px}.rule-head{display:flex;align-items:center;gap:8px;font-size:14px}.rule-leaf{border-top-color:var(--leaf)}.rule-head-leaf{color:var(--leaf)}.rule-danger{border-top-color:var(--danger)}.rule-head-danger{color:var(--danger)}.rule-amber{border-top-color:var(--amber)}.rule-head-amber{color:#C97C00}.rrow{display:grid;grid-template-columns:44px 180px 1fr;gap:16px;align-items:baseline;padding:13px 0;border-top:1px solid var(--line);font-size:14px}.rrow:first-child{border-top:none}.rm{color:var(--cyan);font-size:11.5px}.rt{font-weight:700}.rd{color:var(--muted);font-size:13.5px}.faq{margin-top:30px;max-width:780px}.faq-item{border-top:1px solid var(--line)}.faq-item:last-child{border-bottom:1px solid var(--line)}.faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;background:none;border:none;color:var(--text);text-align:left;font-weight:800;font-size:15.5px;padding:17px 4px}.faq-q:hover{color:var(--cyan)}.faq-chev{color:var(--cyan);font-size:14px}.faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease}.faq-open .faq-a{max-height:240px}.faq-a p{color:var(--muted);font-size:14px;line-height:1.75;padding:0 4px 18px;max-width:66ch}.finale{padding:clamp(48px,8vh,88px) 0 clamp(48px,9vh,96px)}.finale-inner{position:relative;overflow:hidden;text-align:center;padding:clamp(40px,7vh,68px) 24px;border-color:var(--line2)}.finale-glow{position:absolute;inset:-40%;background:radial-gradient(closest-side,rgba(242,169,59,.16),transparent 65%);animation:floatGlow 9s ease-in-out infinite alternate}@keyframes floatGlow{from{transform:translate(-6%,-4%)}to{transform:translate(8%,6%)}}.finale-inner>*{position:relative}.finale-mark{margin:0 auto 18px;border-radius:16px}.finale h2{font-size:clamp(26px,3.2vw,40px);margin-top:18px}.finale-sub{color:var(--muted);margin:12px 0 26px}.footer{border-top:1px solid var(--line);background:var(--navbg)}.footer-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding:32px 0}.footer-note{font-size:11.5px;color:var(--muted)}.footer-links{display:flex;gap:22px}.footer-links button{background:none;border:none;color:var(--muted);font-size:14px;padding:0}.footer-links button:hover{color:var(--cyan)}
.ws-shell{min-height:100vh;background:radial-gradient(circle at 82% 0%,rgba(94,231,220,.08),transparent 30%),linear-gradient(180deg,rgba(18,25,29,.98) 0%,#07090c 34%,#050607 100%)}.ws{padding-top:20px;padding-bottom:60px}.ws-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:20px}.ws-title{display:flex;align-items:center;gap:14px}.ws-title-icon{width:44px;height:44px}.ws-title h1{font-size:22px}.ws-sub{font-size:.66rem;text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}.ws-chips{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.ws-grid{display:grid;grid-template-columns:260px minmax(0,1fr) 340px;gap:18px;align-items:start}.ws-rail{display:grid;gap:18px;align-content:start}.ws-sources{display:grid;gap:8px;margin-top:16px}.ws-source{display:flex;justify-content:space-between;align-items:center;min-height:42px;border:1px solid var(--line);border-radius:7px;padding:0 12px;background:rgba(3,6,7,.55);color:var(--muted);font-size:13px}.ws-source-on{border-color:rgba(94,231,220,.4);background:rgba(94,231,220,.1);color:var(--cyan)}.ws-objectives{display:grid;gap:12px;margin-top:16px}.ws-obj{display:flex;gap:11px;font-size:13.5px;line-height:1.55;color:rgba(224,242,254,.82)}.ws-obj-box{margin-top:2px;display:grid;place-items:center;width:20px;height:20px;flex:0 0 auto;border-radius:5px;border:1px solid var(--line);color:var(--muted)}.ws-obj-done{border-color:rgba(114,230,163,.4);background:rgba(114,230,163,.1);color:var(--leaf)}.ws-hint-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.ws-hint-n{font-size:28px;color:var(--amber)}.ws-hint-text{margin:14px 0 4px;padding:12px;border-radius:7px;font-size:13px;line-height:1.65;color:var(--amber);background:rgba(242,169,59,.08);border:1px solid rgba(242,169,59,.3)}.ws-logs{min-width:0;overflow:hidden}.ws-logbar{border-bottom:1px solid var(--line);background:rgba(16,26,33,.35);padding:14px 16px}.ws-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.ws-search{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;min-height:40px;border:1px solid var(--line);border-radius:7px;background:rgba(3,6,7,.7);padding:0 14px;color:var(--muted)}.ws-search input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:var(--text);font-size:13px}.ws-toggle{min-height:40px;border-radius:7px;border:1px solid var(--line2);padding:0 14px;background:rgba(3,6,7,.45);color:var(--text);font-size:13px;font-weight:700}.ws-toggle-on{border-color:rgba(242,169,59,.4);background:rgba(242,169,59,.1);color:var(--amber)}.ws-count{margin-left:auto;font-size:.64rem;letter-spacing:.18em;color:var(--muted)}.ws-logscroll{max-height:560px;overflow:auto;background:rgba(3,6,7,.88);padding:8px}.ws-row{display:grid;grid-template-columns:2.4rem 4.6rem 6.6rem minmax(0,1fr) 6rem;align-items:center;gap:12px;width:100%;min-width:700px;border-left:2px solid transparent;border-radius:5px;padding:8px 10px;font-size:12.5px;text-align:left;cursor:pointer}.ws-row:hover{background:rgba(11,19,24,.5)}.ws-sev-critical{border-left-color:var(--danger);background:rgba(255,79,88,.08);color:#ffe0e2}.ws-sev-warn{border-left-color:rgba(242,169,59,.4);color:var(--amber)}.ws-sev-muted{color:#64748b}.ws-sev-info{color:rgba(224,242,254,.85)}.ws-row-sel{background:rgba(94,231,220,.1);box-shadow:inset 3px 0 0 var(--cyan)}.ws-row-pin{outline:1px solid rgba(242,169,59,.25);outline-offset:-1px}.ws-c-id,.ws-c-t{color:#64748b}.ws-c-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ws-pinbtn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--line2);border-radius:5px;padding:4px 8px;background:rgba(3,6,7,.5);color:var(--muted);font-size:.6rem;letter-spacing:.12em}.ws-pinbtn-on{color:var(--amber);border-color:rgba(242,169,59,.5);background:rgba(242,169,59,.1)}
.ws-inspect{margin-top:16px;border:1px solid rgba(94,231,220,.35);background:rgba(94,231,220,.06);border-radius:8px;padding:14px}.ws-inspect-meta{display:flex;justify-content:space-between;font-size:.64rem;letter-spacing:.1em;color:var(--muted)}.ws-inspect-text{margin-top:12px;border:1px solid var(--line);background:rgba(3,6,7,.78);border-radius:7px;padding:10px 12px;font-size:12.5px;line-height:1.7;color:rgba(224,242,254,.88)}.ws-note{margin-top:10px;width:100%;min-height:84px;border-radius:7px;border:1px solid var(--line2);background:rgba(3,6,7,.8);color:var(--text);padding:10px 12px;font-size:13px;line-height:1.6;outline:none}.ws-note:focus{border-color:rgba(94,231,220,.55)}.ws-note-lg{min-height:130px}.ws-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ws-tag{border:1px solid;border-radius:5px;padding:3px 8px;font-size:.66rem}.ws-tag-danger{color:var(--danger);border-color:rgba(255,79,88,.4);background:rgba(255,79,88,.08)}.ws-tag-amber{color:var(--amber);border-color:rgba(242,169,59,.4);background:rgba(242,169,59,.08)}.ws-tag-cyan{color:var(--cyan);border-color:rgba(94,231,220,.4);background:rgba(94,231,220,.07)}.ws-tag-violet{color:var(--violet);border-color:rgba(140,141,255,.4);background:rgba(140,141,255,.08)}.ws-conf{display:flex;align-items:center;gap:7px;margin-top:12px;font-size:13px;color:var(--muted)}.ws-conf-lg{margin-top:6px}.ws-dot{width:16px;height:16px;border-radius:4px;border:1px solid var(--line2);background:rgba(3,6,7,.6);padding:0}.ws-dot-on{background:var(--cyan);border-color:var(--cyan)}.ws-entities{display:grid;gap:8px;margin-top:16px}.ws-entity{border-radius:7px;padding:9px 12px;font-size:12.5px}.ws-entity-empty{color:var(--muted);font-size:13px;margin-top:14px}.ws-narrow{max-width:720px;margin:0 auto}.ws-report{margin-top:18px;display:grid;gap:18px}.ws-field{display:grid;gap:8px}.ws-label{font-size:.68rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}.ws-verdicts{display:flex;gap:8px;flex-wrap:wrap}.ws-verdict{border:1px solid var(--line2);border-radius:7px;padding:9px 16px;background:rgba(3,6,7,.55);color:var(--muted);font-weight:700;font-size:13.5px}.ws-verdict-on{color:var(--danger);border-color:rgba(255,79,88,.5);background:rgba(255,79,88,.1)}.ws-cited{display:flex;flex-wrap:wrap;gap:6px}.ws-cite{border:1px solid rgba(94,231,220,.35);background:rgba(94,231,220,.07);color:var(--cyan);border-radius:5px;padding:3px 8px;font-size:.66rem}.ws-report-actions{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.ws-bubble{margin:18px 0 0}.ws-debrief{display:grid;grid-template-columns:300px minmax(0,1fr) 340px;gap:18px;align-items:start}.ws-scoretile{text-align:center;display:grid;justify-items:center}.ws-total{display:grid;place-items:center;width:120px;height:120px;border-radius:12px;border:1px solid rgba(94,231,220,.35);background:rgba(94,231,220,.1)}.ws-total span{font-size:40px;font-weight:900;color:var(--cyan)}.ws-total-low{border-color:rgba(255,79,88,.4);background:rgba(255,79,88,.08)}.ws-total-low span{color:var(--danger)}.ws-scoretile h2{margin-top:18px;font-size:20px}.ws-debrief-copy{margin-top:12px;color:rgba(224,242,254,.72);font-size:14px;line-height:1.7}.ws-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}.ws-metrics{display:grid;gap:14px;margin-top:18px}.ws-metric-row{display:flex;justify-content:space-between;font-size:.66rem;letter-spacing:.14em;color:var(--muted);margin-bottom:6px;text-transform:uppercase}.ws-feedback{margin-top:14px;font-size:13.5px;line-height:1.7;color:rgba(224,242,254,.78)}.ws-debrief-actions{display:grid;gap:8px}
.auth-wrap{min-height:100vh;display:flex;flex-direction:column}.nav-auth-page{position:static}.auth-main{flex:1;display:grid;grid-template-columns:.9fr 1.1fr;gap:22px;align-items:stretch;padding-top:28px;padding-bottom:70px;max-width:1080px}.auth-side{padding:28px;display:flex;flex-direction:column;gap:22px}.auth-side-brand{display:flex;align-items:center;gap:16px}.auth-side-word{font-size:22px;display:block}.auth-side-tag{display:block;font-size:.6rem;letter-spacing:.22em;color:var(--muted);margin-top:4px}.auth-side-copy{font-size:15px;font-weight:700;color:rgba(224,242,254,.9);line-height:1.6}.auth-feed{border:1px solid var(--line);border-radius:8px;background:rgba(3,6,7,.6);padding:12px;display:grid;gap:4px}.auth-feed-head{display:flex;align-items:center;gap:8px;font-size:.6rem;letter-spacing:.18em;color:var(--muted);margin-bottom:4px}.auth-features{display:grid;gap:14px}.auth-feature{display:flex;gap:12px;align-items:flex-start}.auth-feature .ph-icon{width:32px;height:32px}.auth-feature strong{display:block;font-size:13.5px}.auth-feature p{font-size:12.5px;color:var(--muted);line-height:1.6}.auth-status{display:flex;flex-wrap:wrap;gap:14px;margin-top:auto}.astat{display:inline-flex;align-items:center;gap:7px;font-size:.6rem;letter-spacing:.16em;color:var(--leaf)}.astat-dot{width:7px;height:7px;border-radius:999px;background:var(--leaf);animation:softPulse 2.6s ease-in-out infinite}.auth-side-foot{font-size:.58rem;letter-spacing:.14em;color:var(--muted)}.auth-card{position:relative;overflow:hidden;padding:clamp(26px,4vw,38px)}.auth-icon{margin-bottom:18px}.auth-kicker{margin-bottom:14px}.auth-h1{font-size:26px;margin-bottom:6px}.auth-sub{color:var(--muted);font-size:14px;margin-bottom:22px}.auth-form{display:flex;flex-direction:column;gap:16px}.field label{display:block;font-size:13px;font-weight:700;color:var(--muted);margin-bottom:7px}.field-box{display:flex;align-items:center;background:var(--well);border:1px solid var(--line2);border-radius:8px}.field-box:focus-within{border-color:var(--cyan);background:var(--panel);box-shadow:0 0 0 3px rgba(14,156,144,.14)}.field-err{border-color:var(--danger)}.field-box input{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:15px;padding:11px 13px;min-width:0}.field-box input::placeholder{color:var(--muted);opacity:.7}.field-toggle{background:none;border:none;color:var(--muted);font-size:.62rem;letter-spacing:.12em;padding:0 13px}.field-hint{font-size:12.5px;color:var(--muted);margin-top:6px}.field-error{font-size:12.5px;color:var(--danger);margin-top:6px;font-weight:600}.auth-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.checkline{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--text);cursor:pointer;user-select:none}.checkline input{position:absolute;opacity:0;width:0;height:0}.checkbox{display:grid;place-items:center;width:18px;height:18px;flex:0 0 auto;border-radius:5px;border:1px solid var(--line2);background:var(--well);color:#fff}.checkline input:checked+.checkbox{background:var(--cyan);border-color:var(--cyan)}.inline-note{font-size:.62rem;letter-spacing:.1em;color:#C97C00;background:rgba(242,169,59,.1);border:1px solid rgba(201,124,0,.35);border-radius:7px;padding:9px 12px;line-height:1.6}.pwmeter{display:flex;align-items:center;gap:10px;margin-top:8px}.pwsegs{display:flex;gap:5px;flex:1}.pwseg{height:5px;flex:1;border-radius:3px;background:var(--line)}.pwseg-danger{background:var(--danger)}.pwseg-amber{background:var(--amber)}.pwseg-leaf{background:var(--leaf)}.pwlabel{font-size:.6rem;letter-spacing:.16em}.seg-row{display:flex;gap:8px;flex-wrap:wrap}.seg{border:1px solid var(--line2);border-radius:7px;padding:8px 14px;background:var(--well);color:var(--muted);font-weight:700;font-size:13px}.seg-on{color:var(--cyan);border-color:rgba(14,156,144,.5);background:rgba(14,156,144,.08)}.divider{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:.6rem;letter-spacing:.2em;margin-top:2px}.divider::before,.divider::after{content:"";height:1px;flex:1;background:var(--line)}.sso-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sso-btn{font-size:13px;padding:10px 8px}.auth-alt{font-size:14px;color:var(--muted);text-align:center;margin-top:4px}.link{background:none;border:none;color:var(--cyan);font-size:13.5px;padding:0;text-decoration:underline;text-underline-offset:3px}.proto-notice{background:rgba(242,169,59,.1);border:1px solid rgba(201,124,0,.4);border-radius:8px;padding:18px;font-size:14px;display:flex;flex-direction:column;gap:10px}
@media (max-width:1180px){.ws-grid{grid-template-columns:1fr}.ws-rail{grid-template-columns:1fr 1fr}.ws-debrief{grid-template-columns:1fr}.auth-main{grid-template-columns:1fr;max-width:560px}.auth-side{order:2}}@media (max-width:1080px){.hero{grid-template-columns:1fr}.steps{grid-template-columns:repeat(2,1fr)}.split,.trio{grid-template-columns:1fr}.navpill{display:none}.crow{grid-template-columns:1fr;gap:4px}.crow-head{display:none}.cold::before{content:"OLD - ";font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;color:var(--muted)}.cnew::before{content:"HERE - ";font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;color:var(--cyan)}}@media (max-width:700px){.steps{grid-template-columns:1fr}.logline{font-size:10px}.source-row{grid-template-columns:1fr;gap:2px}.source-cad{text-align:left}.rrow{grid-template-columns:44px 1fr}.rd{grid-column:2}.ws-rail{grid-template-columns:1fr}.sso-row{grid-template-columns:1fr}.hero-brand-row{align-items:flex-start}.hero-brand-mark{--logo-size:72px!important}.hero-brand-word{font-size:22px}.hero-brand-sub{font-size:.58rem}}@media (prefers-reduced-motion:reduce){.cr-root *,.cr-root *::before,.cr-root *::after{animation:none!important;transition:none!important}[data-reveal]{opacity:1!important;transform:none!important}.logo-mark-img{transform:translateY(1px)!important}}
`;
