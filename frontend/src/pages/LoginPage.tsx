import { Fingerprint, Flame, KeyRound, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import type { Navigate } from "../types";
import { Brand } from "../components/layout/Brand";
import { GhostButton, SolidButton } from "../components/ui/Button";
import { CheckLabel, Divider, Field } from "../components/ui/Form";
import { Kicker } from "../components/ui/Kicker";
import { Panel } from "../components/ui/Panel";

export function LoginPage({ navigate }: { navigate: Navigate }) {
  const { login, error, clearError, isLoading } = useAuth();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("analyst@company.com");
  const [password, setPassword] = useState("");
  const from = typeof location.state === "object" && location.state !== null && "from" in location.state
    ? String((location.state as { from: unknown }).from)
    : "/scenarios";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    await login(email, password);
    routerNavigate(from, { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Analyst Return"
      title="Welcome back to the console."
      copy="Resume your shift. Your last investigation, pinned evidence, and report drafts are right where you left them."
      panel={<LastSessionPanel />}
      navigate={navigate}
    >
      <Kicker>Secure Login</Kicker>
      <h1 className="mt-5 text-3xl font-black tracking-normal">Log in</h1>
      <p className="mt-4 text-sky-100/75">Resume your investigation.</p>
      <form className="mt-9 grid gap-6" onSubmit={handleSubmit}>
        <Field
          label="Work email"
          icon={Mail}
          value="analyst@company.com"
          inputValue={email}
          onValueChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          icon={LockKeyhole}
          value="Your password"
          type="password"
          action="Forgot?"
          inputValue={password}
          onValueChange={setPassword}
          autoComplete="current-password"
          required
        />
        <CheckLabel>Keep this terminal trusted for 30 days</CheckLabel>
        {error && <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        <SolidButton type="submit" icon={Sparkles} className="w-full">
          {isLoading ? "Signing in..." : "Log In"}
        </SolidButton>
        <Divider>Or continue with</Divider>
        <div className="grid gap-3 sm:grid-cols-2">
          <GhostButton icon={KeyRound} className="w-full">SSO</GhostButton>
          <GhostButton icon={Fingerprint} className="w-full">Passkey</GhostButton>
        </div>
        <p className="text-center text-sm text-muted">
          New to AfterMath?{" "}
          <button type="button" onClick={() => navigate("signup")} className="font-bold text-cyan">
            Request access -&gt;
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  eyebrow,
  title,
  copy,
  panel,
  children,
  navigate,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  panel: ReactNode;
  children: ReactNode;
  navigate: Navigate;
}) {
  return (
    <section className="grid min-h-[calc(100vh_-_70px)] grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="flex min-h-[500px] flex-col justify-between border-b border-line bg-panel/42 px-8 py-10 md:px-12 lg:border-b-0 lg:border-r">
        <button type="button" onClick={() => navigate("home")}>
          <Brand />
        </button>
        <div className="max-w-xl py-16">
          <Kicker>{eyebrow}</Kicker>
          <h1 className="mt-6 text-balance text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-8 text-base leading-7 text-sky-100/78">{copy}</p>
          <div className="mt-10">{panel}</div>
        </div>
      </aside>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[526px]">{children}</div>
      </div>
    </section>
  );
}

function LastSessionPanel() {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.34em] text-muted">
          Last session - 03 Nov 02:17 UTC
        </span>
        <span className="rounded border border-amber/35 bg-amber/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-amber">
          In progress
        </span>
      </div>
      <div className="mt-7 flex gap-4">
        <span className="grid h-10 w-10 place-items-center rounded border border-danger/30 bg-danger/12 text-danger">
          <Flame size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <strong>INC-2024-0473 - web-edge-04</strong>
          <p className="mt-1 font-mono text-xs text-muted">
            compromised svc-backup - 4/7 evidence pinned
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
            <span className="block h-full w-[58%] rounded-full bg-cyan" />
          </div>
          <div className="mt-4 flex justify-between font-mono text-xs">
            <span className="text-muted">58% complete</span>
            <span className="text-amber">00:42:18 remaining</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
