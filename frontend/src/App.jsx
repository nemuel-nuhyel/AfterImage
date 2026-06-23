import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Eye,
  FileText,
  Filter,
  Fingerprint,
  Gauge,
  KeyRound,
  LockKeyhole,
  Mail,
  Pin,
  Play,
  Radar,
  Search,
  Shield,
  Signal,
  Terminal,
  Timer,
  User,
  UserPlus,
  Zap,
} from "lucide-react";

const pages = [
  { id: "home", label: "Home" },
  { id: "scenarios", label: "Scenarios" },
  { id: "briefing", label: "Briefing" },
  { id: "workspace", label: "Workspace" },
  { id: "evidence", label: "Evidence" },
  { id: "report", label: "Report" },
  { id: "debrief", label: "Debrief" },
];

const scenario = {
  title: "SSH Reconnaissance",
  difficulty: "Beginner",
  timeLimit: "10 min",
  hintBudget: 3,
  timelineDay: "Day 1",
  description: "A junior analyst notices unusual activity on the development server.",
  logs: ["auth.log", "firewall.log", "audit.log"],
  objectives: [
    "Identify brute-force SSH patterns",
    "Distinguish failed vs successful authentication",
    "Recognize red herrings",
    "Find evidence of successful compromise hidden in noise",
  ],
};

const logLines = [
  {
    line: 118,
    time: "02:00:02",
    source: "auth.log",
    severity: "warn",
    text: "sshd[2177]: Failed password for root from 10.0.0.55 port 49122 ssh2",
  },
  {
    line: 119,
    time: "02:00:04",
    source: "auth.log",
    severity: "warn",
    text: "sshd[2177]: Failed password for root from 10.0.0.55 port 49124 ssh2",
  },
  {
    line: 220,
    time: "02:15:33",
    source: "auth.log",
    severity: "critical",
    text: "sshd[3010]: Accepted password for backup_svc from 10.0.0.55 port 50944 ssh2",
  },
  {
    line: 224,
    time: "02:16:45",
    source: "audit.log",
    severity: "critical",
    text: "sudo: backup_svc : TTY=pts/0 ; COMMAND=/usr/bin/cat /etc/shadow",
  },
  {
    line: 311,
    time: "09:05:00",
    source: "auth.log",
    severity: "muted",
    text: "sshd[4512]: Failed password for admin from 192.168.1.10 port 50330 ssh2",
  },
];

const evidence = [
  {
    id: "E-221A",
    file: "auth.log",
    line: 220,
    timestamp: "02:15:33",
    content: "Accepted password for backup_svc from 10.0.0.55",
    note: "Successful login after the brute-force window. Strong indicator that the attack did not simply fail.",
    tags: ["ip: 10.0.0.55", "user: backup_svc"],
  },
  {
    id: "E-224C",
    file: "audit.log",
    line: 224,
    timestamp: "02:16:45",
    content: "backup_svc executed cat /etc/shadow through sudo",
    note: "Privilege escalation and credential access behavior immediately follows the accepted login.",
    tags: ["service: sudo", "file: /etc/shadow"],
  },
  {
    id: "E-048F",
    file: "firewall.log",
    line: 87,
    timestamp: "02:15:33",
    content: "ALLOW TCP 10.0.0.55:50944 -> dev-server:22",
    note: "Firewall confirms inbound SSH was allowed at the same time as the accepted auth event.",
    tags: ["ip: 10.0.0.55", "port: 22"],
  },
];

const scoreRows = [
  ["Detection accuracy", 28, 30],
  ["Evidence quality", 23, 25],
  ["Impact analysis", 21, 25],
  ["Response plan", 17, 20],
  ["Time bonus", 4, 5],
  ["Hint penalty", -1, 0],
];

function App() {
  const [activePage, setActivePage] = useState("home");
  const [mode, setMode] = useState("Timed");
  const [activeLog, setActiveLog] = useState("auth.log");
  const [selectedLine, setSelectedLine] = useState(220);
  const [showInit, setShowInit] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [pinned, setPinned] = useState(false);

  const currentPage = useMemo(() => {
    const content = {
      home: <HomePage navigate={setActivePage} />,
      login: <LoginPage navigate={setActivePage} />,
      signup: <SignupPage navigate={setActivePage} />,
      scenarios: <ScenarioLibrary navigate={setActivePage} start={startInvestigation} />,
      briefing: (
        <MissionBriefing
          mode={mode}
          setMode={setMode}
          navigate={setActivePage}
          start={startInvestigation}
        />
      ),
      workspace: (
        <InvestigationWorkspace
          activeLog={activeLog}
          setActiveLog={setActiveLog}
          selectedLine={selectedLine}
          setSelectedLine={setSelectedLine}
          pinned={pinned}
          markEvidence={markEvidence}
          navigate={setActivePage}
        />
      ),
      evidence: <EvidenceBoard navigate={setActivePage} />,
      report: <ReportDrafting submit={submitReport} navigate={setActivePage} />,
      debrief: <ScoreDebrief navigate={setActivePage} />,
    };

    return content[activePage] ?? content.home;
  }, [activePage, activeLog, mode, pinned, selectedLine]);

  function startInvestigation() {
    setShowInit(true);
    window.setTimeout(() => {
      setShowInit(false);
      setActivePage("workspace");
    }, 1200);
  }

  function markEvidence() {
    setPinned(true);
    window.setTimeout(() => setPinned(false), 1600);
  }

  function submitReport() {
    setShowSubmit(true);
    window.setTimeout(() => {
      setShowSubmit(false);
      setActivePage("debrief");
    }, 1250);
  }

  return (
    <div className="app-shell">
      <AmbientBackground />
      <Header activePage={activePage} navigate={setActivePage} />
      <main className="page-transition" key={activePage}>
        {currentPage}
      </main>
      {showInit && <TerminalOverlay title="Initializing investigation session" />}
      {showSubmit && <TerminalOverlay title="Sealing report package" secure />}
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-scan" />
      <div className="ambient-vignette" />
    </div>
  );
}

function Header({ activePage, navigate }) {
  return (
    <header className="top-nav">
      <button className="brand-button" onClick={() => navigate("home")} type="button">
        <span className="brand-mark">
          <Fingerprint size={18} />
        </span>
        <span>
          <strong>AfterMath</strong>
          <small>Adversarial SOC simulator</small>
        </span>
      </button>

      <nav className="nav-links" aria-label="Primary navigation">
        {pages.map((page) => (
          <button
            className={activePage === page.id ? "active" : ""}
            key={page.id}
            onClick={() => navigate(page.id)}
            type="button"
          >
            {page.label}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="ghost-button" onClick={() => navigate("login")} type="button">
          <KeyRound size={16} />
          Login
        </button>
        <button className="primary-button compact" onClick={() => navigate("signup")} type="button">
          <UserPlus size={16} />
          Sign up
        </button>
      </div>
    </header>
  );
}

function HomePage({ navigate }) {
  return (
    <section className="home-page">
      <div className="hero">
        <div className="hero-copy">
          <StatusPill tone="cyan" icon={<Signal size={14} />}>
            Live training console
          </StatusPill>
          <h1>AfterMath</h1>
          <p>
            Investigate hostile activity in realistic logs, pin evidence, write incident
            reports, and sharpen analyst judgment under pressure.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("briefing")} type="button">
              <Play size={17} />
              Start Training
            </button>
            <button className="ghost-button large" onClick={() => navigate("scenarios")} type="button">
              <Database size={17} />
              View Scenarios
            </button>
          </div>
          <div className="hero-metrics" aria-label="Training metrics">
            <Metric value="03" label="Logs" />
            <Metric value="10m" label="Timed run" />
            <Metric value="91" label="Target score" />
          </div>
        </div>

        <div className="command-preview" aria-label="AfterMath workspace preview">
          <div className="preview-top">
            <span>scenario_1 / ssh_reconnaissance</span>
            <StatusPill tone="green" icon={<CircleDot size={12} />}>
              Active
            </StatusPill>
          </div>
          <div className="preview-grid">
            <div className="preview-panel log-panel">
              <PanelTitle icon={<Terminal size={15} />} title="Log stream" />
              {logLines.slice(0, 4).map((item) => (
                <div className={`mini-log ${item.severity}`} key={`${item.source}-${item.line}`}>
                  <span>{item.time}</span>
                  <code>{item.text}</code>
                </div>
              ))}
            </div>
            <div className="preview-panel">
              <PanelTitle icon={<Pin size={15} />} title="Evidence" />
              <div className="mini-evidence">
                <strong>Accepted password</strong>
                <span>backup_svc from 10.0.0.55</span>
              </div>
              <div className="mini-evidence">
                <strong>Privilege action</strong>
                <span>cat /etc/shadow</span>
              </div>
            </div>
            <div className="preview-panel score-preview">
              <PanelTitle icon={<Gauge size={15} />} title="Debrief" />
              <CircularScore value="92" />
            </div>
          </div>
        </div>
      </div>

      <div className="feature-band">
        <FeatureTile icon={<Terminal />} title="Realistic log investigations">
          Inspect auth, firewall, and audit streams with hidden success events and red herrings.
        </FeatureTile>
        <FeatureTile icon={<Pin />} title="Evidence-based reporting">
          Build a defensible case from exact log lines, timestamps, notes, and entity tags.
        </FeatureTile>
        <FeatureTile icon={<Timer />} title="Timed analyst scenarios">
          Practice under operational pressure with hints, countdowns, and difficulty bands.
        </FeatureTile>
        <FeatureTile icon={<BarChart3 />} title="Scoring and debriefs">
          Review accuracy, evidence quality, impact analysis, and response planning.
        </FeatureTile>
      </div>
    </section>
  );
}

function LoginPage({ navigate }) {
  return (
    <AuthLayout
      eyebrow="Secure analyst access"
      title="Log in to AfterMath"
      subtitle="Resume investigations, draft reports, and review prior debriefs."
      footer={
        <>
          New analyst?{" "}
          <button onClick={() => navigate("signup")} type="button">
            Create account
          </button>
        </>
      }
    >
      <label>
        Email
        <span className="input-shell">
          <Mail size={16} />
          <input placeholder="analyst@aftermath.local" type="email" />
        </span>
      </label>
      <label>
        Password
        <span className="input-shell">
          <LockKeyhole size={16} />
          <input placeholder="Enter passphrase" type="password" />
        </span>
      </label>
      <div className="auth-row">
        <label className="check-label">
          <input type="checkbox" />
          Keep session sealed
        </label>
        <button className="text-button" type="button">
          Forgot password
        </button>
      </div>
      <button className="primary-button full" onClick={() => navigate("scenarios")} type="button">
        <KeyRound size={17} />
        Log In
      </button>
    </AuthLayout>
  );
}

function SignupPage({ navigate }) {
  return (
    <AuthLayout
      eyebrow="Create analyst profile"
      title="Join the training console"
      subtitle="Set up a workspace for timed investigations, evidence boards, and score history."
      footer={
        <>
          Already have an account?{" "}
          <button onClick={() => navigate("login")} type="button">
            Log in
          </button>
        </>
      }
    >
      <label>
        Name
        <span className="input-shell">
          <User size={16} />
          <input placeholder="Nadia Chen" type="text" />
        </span>
      </label>
      <label>
        Email
        <span className="input-shell">
          <Mail size={16} />
          <input placeholder="analyst@aftermath.local" type="email" />
        </span>
      </label>
      <label>
        Password
        <span className="input-shell">
          <LockKeyhole size={16} />
          <input placeholder="Create passphrase" type="password" />
        </span>
      </label>
      <label>
        Confirm password
        <span className="input-shell">
          <Shield size={16} />
          <input placeholder="Confirm passphrase" type="password" />
        </span>
      </label>
      <div className="strength">
        <span>Password strength</span>
        <div className="strength-track">
          <span />
          <span />
          <span />
          <i />
        </div>
        <strong>Hardened</strong>
      </div>
      <button className="primary-button full" onClick={() => navigate("scenarios")} type="button">
        <UserPlus size={17} />
        Create Account
      </button>
    </AuthLayout>
  );
}

function AuthLayout({ eyebrow, title, subtitle, footer, children }) {
  return (
    <section className="auth-page">
      <div className="auth-intel">
        <StatusPill tone="amber" icon={<Eye size={14} />}>
          Private beta
        </StatusPill>
        <h2>Train like every log line is hiding the answer.</h2>
        <p>
          AfterMath rewards careful reasoning: failed attempts, successful auth, firewall
          corroboration, and impact evidence all matter.
        </p>
        <div className="trust-list">
          <span>
            <Shield size={15} />
            Scenario-safe telemetry
          </span>
          <span>
            <LockKeyhole size={15} />
            Isolated analyst profiles
          </span>
          <span>
            <Activity size={15} />
            Debrief-ready reports
          </span>
        </div>
      </div>
      <form className="auth-card">
        <span className="form-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="form-stack">{children}</div>
        <div className="auth-footer">{footer}</div>
      </form>
    </section>
  );
}

function ScenarioLibrary({ navigate, start }) {
  return (
    <section className="dashboard-page">
      <PageHeader
        kicker="Scenario library"
        title="Choose an investigation"
        description="Every scenario is a constrained incident simulation with realistic log noise, hidden compromise signals, and report grading."
        action={
          <button className="primary-button" onClick={() => navigate("briefing")} type="button">
            <FileText size={17} />
            Open Briefing
          </button>
        }
      />

      <div className="filter-bar">
        <FilterChip icon={<Filter size={14} />} label="Difficulty" value="Beginner" />
        <FilterChip icon={<Radar size={14} />} label="Attack type" value="Credential access" />
        <FilterChip icon={<CheckCircle2 size={14} />} label="Status" value="Available" />
        <FilterChip icon={<Timer size={14} />} label="Mode" value="Timed" />
      </div>

      <div className="scenario-grid">
        <article className="scenario-card featured-card">
          <div className="card-topline">
            <StatusPill tone="cyan" icon={<CircleDot size={12} />}>
              {scenario.timelineDay}
            </StatusPill>
            <span className="difficulty">{scenario.difficulty}</span>
          </div>
          <h2>{scenario.title}</h2>
          <p>{scenario.description}</p>
          <div className="meta-grid">
            <Meta icon={<Clock3 />} label="Time limit" value={scenario.timeLimit} />
            <Meta icon={<Zap />} label="Hints" value={`${scenario.hintBudget} available`} />
            <Meta icon={<Database />} label="Artifacts" value={`${scenario.logs.length} logs`} />
          </div>
          <div className="log-chips">
            {scenario.logs.map((log) => (
              <span key={log}>{log}</span>
            ))}
          </div>
          <div className="scenario-actions">
            <button className="primary-button" onClick={start} type="button">
              <Play size={17} />
              Start Investigation
            </button>
            <button className="ghost-button" onClick={() => navigate("briefing")} type="button">
              Details
              <ChevronRight size={16} />
            </button>
          </div>
        </article>

        <ScenarioStub title="Web Shell Drift" difficulty="Intermediate" status="Locked" />
        <ScenarioStub title="Suspicious Cloud Token" difficulty="Advanced" status="Queued" />
      </div>
    </section>
  );
}

function MissionBriefing({ mode, setMode, start }) {
  return (
    <section className="briefing-page">
      <PageHeader
        kicker="Mission briefing"
        title={scenario.title}
        description={scenario.description}
        action={
          <button className="primary-button" onClick={start} type="button">
            <Play size={17} />
            Initialize Session
          </button>
        }
      />

      <div className="briefing-layout">
        <article className="classified-panel">
          <div className="classified-header">
            <span>CLASSIFIED TRAINING FILE</span>
            <strong>AFM-SOC-001</strong>
          </div>
          <div className="briefing-meta">
            <Meta icon={<Clock3 />} label="Window" value="10 minutes" />
            <Meta icon={<Zap />} label="Hints" value="3" />
            <Meta icon={<Database />} label="Logs" value="auth, firewall, audit" />
          </div>
          <h2>Objectives</h2>
          <ul className="objective-list">
            {scenario.objectives.map((objective) => (
              <li key={objective}>
                <CheckCircle2 size={16} />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="mode-panel">
          <PanelTitle icon={<Gauge size={16} />} title="Session mode" />
          <div className="mode-switch" role="tablist" aria-label="Session mode">
            {["Practice", "Timed", "Exam"].map((item) => (
              <button
                className={mode === item ? "active" : ""}
                key={item}
                onClick={() => setMode(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mission-status">
            <span>Mission status</span>
            <strong>Ready for analyst</strong>
            <p>Evidence must support attack success, target accounts, and immediate response actions.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function InvestigationWorkspace({
  activeLog,
  setActiveLog,
  selectedLine,
  setSelectedLine,
  pinned,
  markEvidence,
  navigate,
}) {
  return (
    <section className="workspace-page">
      <div className="workspace-topbar">
        <div>
          <span className="form-eyebrow">Active investigation</span>
          <h1>{scenario.title}</h1>
        </div>
        <div className="workspace-actions">
          <StatusPill tone="green" icon={<CircleDot size={12} />}>
            Session active
          </StatusPill>
          <div className="timer-low">
            <Timer size={16} />
            02:14
          </div>
          <div className="hint-meter">
            <Zap size={15} />
            1 / 3 hints
          </div>
          <button className="primary-button compact" onClick={() => navigate("report")} type="button">
            <FileText size={16} />
            Submit Report
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="workspace-sidebar panel">
          <PanelTitle icon={<Database size={16} />} title="Sources" />
          <div className="source-list">
            {scenario.logs.map((log) => (
              <button
                className={activeLog === log ? "active" : ""}
                key={log}
                onClick={() => setActiveLog(log)}
                type="button"
              >
                <Terminal size={15} />
                {log}
                <span>{log === "auth.log" ? 348 : log === "audit.log" ? 132 : 94}</span>
              </button>
            ))}
          </div>
          <PanelTitle icon={<CheckCircle2 size={16} />} title="Objectives" />
          <ul className="compact-objectives">
            {scenario.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </aside>

        <section className="log-viewer panel">
          <div className="log-toolbar">
            <div className="log-tabs">
              {scenario.logs.map((log) => (
                <button
                  className={activeLog === log ? "active" : ""}
                  key={log}
                  onClick={() => setActiveLog(log)}
                  type="button"
                >
                  {log}
                </button>
              ))}
            </div>
            <div className="search-box">
              <Search size={15} />
              <span>10.0.0.55</span>
            </div>
          </div>

          <div className="terminal-window">
            {logLines.map((item) => (
              <button
                className={`log-line ${item.severity} ${selectedLine === item.line ? "selected" : ""}`}
                key={`${item.source}-${item.line}`}
                onClick={() => setSelectedLine(item.line)}
                type="button"
              >
                <span className="line-number">{item.line}</span>
                <span className="line-time">{item.time}</span>
                <code>{item.text}</code>
                {item.line === 220 && <span className="inline-tag">suspicious IP</span>}
              </button>
            ))}
          </div>

          <div className="line-actions">
            <span>
              Selected line <strong>{selectedLine}</strong>
            </span>
            <button className="primary-button compact" onClick={markEvidence} type="button">
              <Pin size={16} />
              Mark as Evidence
            </button>
          </div>
        </section>

        <aside className="workspace-evidence panel">
          <PanelTitle icon={<Pin size={16} />} title="Evidence board" />
          {pinned && (
            <div className="pin-confirmation">
              <CheckCircle2 size={16} />
              Line pinned to evidence
            </div>
          )}
          {evidence.slice(0, 2).map((item) => (
            <EvidenceMiniCard key={item.id} item={item} />
          ))}
          <div className="confidence-box">
            <span>Attack succeeded?</span>
            <strong>Likely</strong>
            <div className="confidence-dots">
              {[1, 2, 3, 4, 5].map((dot) => (
                <i className={dot < 5 ? "on" : ""} key={dot} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function EvidenceBoard({ navigate }) {
  return (
    <section className="dashboard-page">
      <PageHeader
        kicker="Evidence board"
        title="Build the case from exact artifacts"
        description="Each pinned line should explain why the incident succeeded, what account was affected, and which response is justified."
        action={
          <button className="primary-button" onClick={() => navigate("report")} type="button">
            <FileText size={17} />
            Draft Report
          </button>
        }
      />
      <div className="evidence-grid">
        {evidence.map((item) => (
          <EvidenceCard key={item.id} item={item} />
        ))}
      </div>
      <div className="entity-strip">
        <Entity type="ip" value="10.0.0.55" />
        <Entity type="user" value="backup_svc" />
        <Entity type="service" value="sudo" />
        <Entity type="file" value="/etc/shadow" />
      </div>
    </section>
  );
}

function ReportDrafting({ submit }) {
  return (
    <section className="report-page">
      <PageHeader
        kicker="Incident report"
        title="Submit defensible findings"
        description="A strong report connects attack timeline, entities, impact, and response actions directly to marked evidence."
        action={
          <button className="primary-button" onClick={submit} type="button">
            <Shield size={17} />
            Submit Report
          </button>
        }
      />

      <div className="report-layout">
        <form className="report-form panel">
          <label>
            What happened?
            <textarea defaultValue="A brute-force SSH sequence against root was followed by a successful login to backup_svc from 10.0.0.55. The same account then accessed /etc/shadow through sudo, indicating credential compromise and post-authentication impact." />
          </label>

          <div className="form-grid">
            <label>
              Suspicious entities
              <input defaultValue="10.0.0.55, backup_svc, sudo, /etc/shadow" />
            </label>
            <label>
              Did the attack succeed?
              <select defaultValue="yes">
                <option value="yes">Yes, likely succeeded</option>
                <option value="no">No</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
          </div>

          <label>
            Confidence level
            <div className="range-row">
              <input defaultValue="4" max="5" min="1" type="range" />
              <strong>4 / 5</strong>
            </div>
          </label>

          <label>
            Response actions
            <textarea defaultValue="Disable backup_svc, rotate credentials, review sudoers policy, preserve logs, block 10.0.0.55, and hunt for follow-on access from the compromised account." />
          </label>
        </form>

        <aside className="report-side panel">
          <PanelTitle icon={<Pin size={16} />} title="Evidence references" />
          {evidence.map((item) => (
            <EvidenceMiniCard key={item.id} item={item} />
          ))}
        </aside>
      </div>
    </section>
  );
}

function ScoreDebrief({ navigate }) {
  const total = scoreRows.reduce((sum, row) => sum + row[1], 0);

  return (
    <section className="debrief-page">
      <PageHeader
        kicker="Score debrief"
        title="Incident package reviewed"
        description="The submitted report correctly identified the successful SSH compromise and supported it with log evidence."
        action={
          <button className="primary-button" onClick={() => navigate("scenarios")} type="button">
            <ArrowRight size={17} />
            Next Scenario
          </button>
        }
      />

      <div className="debrief-layout">
        <article className="score-card panel">
          <CircularScore value={total} />
          <h2>Overall score</h2>
          <p>Strong detection with a clear evidence trail. Improve response specificity around service account recovery.</p>
        </article>

        <section className="score-breakdown panel">
          <PanelTitle icon={<BarChart3 size={16} />} title="Breakdown" />
          {scoreRows.map(([label, value, max]) => (
            <div className="score-row" key={label}>
              <span>{label}</span>
              <div className="score-track">
                <i style={{ width: `${Math.min(100, Math.abs(value / (max || 5)) * 100)}%` }} />
              </div>
              <strong>{value > 0 ? `${value}/${max}` : value}</strong>
            </div>
          ))}
        </section>

        <aside className="feedback-panel panel">
          <PanelTitle icon={<AlertTriangle size={16} />} title="Feedback" />
          <p>
            You correctly prioritized the 02:15 accepted SSH login over the later admin noise.
            The audit evidence confirms impact through credential file access.
          </p>
          <div className="missed-box">
            <strong>Missed evidence</strong>
            <span>Correlate firewall allow event with the exact accepted auth timestamp.</span>
          </div>
          <div className="recommended-box">
            <strong>Recommended next</strong>
            <span>Suspicious Cloud Token</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PageHeader({ kicker, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="form-eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function TerminalOverlay({ title, secure }) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <Terminal size={22} />
        <h2>{title}</h2>
        <code>{secure ? "encrypting_evidence_refs()" : "loading auth.log firewall.log audit.log"}</code>
        <div className="loader-bar">
          <span />
        </div>
      </div>
    </div>
  );
}

function PanelTitle({ icon, title }) {
  return (
    <div className="panel-title">
      {icon}
      <span>{title}</span>
    </div>
  );
}

function StatusPill({ tone = "cyan", icon, children }) {
  return (
    <span className={`status-pill ${tone}`}>
      {icon}
      {children}
    </span>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FeatureTile({ icon, title, children }) {
  return (
    <article className="feature-tile">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

function FilterChip({ icon, label, value }) {
  return (
    <button className="filter-chip" type="button">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div className="meta-item">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScenarioStub({ title, difficulty, status }) {
  return (
    <article className="scenario-card stub-card">
      <div className="card-topline">
        <StatusPill tone="muted" icon={<LockKeyhole size={12} />}>
          {status}
        </StatusPill>
        <span className="difficulty">{difficulty}</span>
      </div>
      <h2>{title}</h2>
      <p>Additional investigation module prepared for later timeline progression.</p>
      <div className="stub-lines">
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

function EvidenceMiniCard({ item }) {
  return (
    <article className="evidence-mini">
      <div>
        <strong>{item.file}</strong>
        <span>line {item.line}</span>
      </div>
      <code>{item.content}</code>
    </article>
  );
}

function EvidenceCard({ item }) {
  return (
    <article className="evidence-card">
      <div className="evidence-head">
        <span>{item.id}</span>
        <strong>
          {item.file}:{item.line}
        </strong>
        <small>{item.timestamp}</small>
      </div>
      <code>{item.content}</code>
      <p>{item.note}</p>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}

function Entity({ type, value }) {
  return (
    <div className="entity">
      <span>{type}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CircularScore({ value }) {
  return (
    <div className="circular-score" style={{ "--score": `${value}%` }}>
      <span>{value}</span>
    </div>
  );
}

export default App;
