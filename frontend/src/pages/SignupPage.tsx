import { Eye, FileKey, KeyRound, LockKeyhole, Mail, ShieldAlert, Terminal, User, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import type { Navigate } from "../types";
import { SolidButton } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";

const amber = "text-[#F2A93B]";
const amberBorder = "border-[#F2A93B]/30";
const amberBg = "bg-[#F2A93B]/8";

export function SignupPage({ navigate }: { navigate: Navigate }) {
  const { signup, error, clearError, isLoading } = useAuth();
  const routerNavigate = useNavigate();
  const [name, setName] = useState("J. Reyes");
  const [email, setEmail] = useState("analyst@company.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    if (password !== confirmPassword) {
      return;
    }
    await signup({
      email,
      username: email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "_"),
      display_name: name,
      password,
    });
    routerNavigate("/scenarios", { replace: true });
  }

  return (
    <section className="min-h-[calc(100vh_-_70px)] px-4 py-8 md:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 md:grid-cols-2 md:items-stretch">
        <Panel className="relative h-full overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 surface-grid opacity-35" aria-hidden="true" />
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 rounded border ${amberBorder} ${amberBg} px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] ${amber}`}>
              <ShieldAlert size={13} /> Request clearance
            </div>
            <h1 className="mt-6 max-w-lg text-balance text-3xl font-black leading-tight sm:text-4xl">
              Provision an analyst seat.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-sky-100/74 sm:text-base">
              Create a training credential for the CyberRange AI simulator. Your investigations, evidence pins, report drafts, and debrief history stay attached to this account.
            </p>

            <div className="mt-8 grid gap-3 lg:grid-cols-3">
              <Signal icon={Terminal} label="Mode" value="Timed drills" />
              <Signal icon={FileKey} label="Evidence" value="Private board" />
              <Signal icon={KeyRound} label="Session" value="Refresh token" />
            </div>

            <ProvisionPanel />
          </div>
        </Panel>

        <div className="w-full">
          <Panel className="h-full overflow-hidden">
            <div className="border-b border-line bg-panel2/35 px-6 py-5">
              <div className={`mb-4 inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] ${amber}`}>
                <UserPlus size={13} /> New account
              </div>
              <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Create account</h1>
              <p className="mt-3 text-sm leading-6 text-sky-100/72">
                Provision your analyst profile. Use a 12+ character password.
              </p>
            </div>

            <form className="grid gap-5 p-6" onSubmit={handleSubmit}>
              <SignupField
                label="Analyst name"
                icon={User}
                value={name}
                placeholder="J. Reyes"
                onValueChange={setName}
                autoComplete="name"
                required
              />
              <SignupField
                label="Work email"
                icon={Mail}
                value={email}
                placeholder="analyst@company.com"
                onValueChange={setEmail}
                autoComplete="email"
                required
              />
              <SignupField
                label="Password"
                icon={LockKeyhole}
                value={password}
                placeholder="At least 12 characters"
                type="password"
                action="required"
                onValueChange={setPassword}
                autoComplete="new-password"
                required
              />
              <PasswordMeter password={password} />
              <SignupField
                label="Confirm password"
                icon={LockKeyhole}
                value={confirmPassword}
                placeholder="Repeat the password"
                type="password"
                onValueChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />

              <label className="flex items-start gap-3 text-sm leading-6 text-sky-100/80">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border border-line2 bg-void accent-[#F2A93B]"
                />
                <span>
                  I accept the <strong className={amber}>Training Charter</strong> and{" "}
                  <strong className={amber}>Data Handling Policy</strong>.
                </span>
              </label>

              {password !== confirmPassword && confirmPassword.length > 0 && (
                <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                  Passwords do not match.
                </div>
              )}
              {error && <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

              <SolidButton
                type="submit"
                icon={UserPlus}
                className="min-h-11 w-full bg-[#F2A93B] text-void shadow-none hover:bg-[#ffbf5c]"
              >
                {isLoading ? "Creating..." : "Create Account"}
              </SolidButton>

              <p className="text-center text-sm text-muted">
                Already cleared?{" "}
                <button type="button" onClick={() => navigate("login")} className={`font-bold ${amber}`}>
                  Log in -&gt;
                </button>
              </p>
            </form>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function SignupField({
  label,
  icon: Icon,
  value,
  placeholder,
  type = "text",
  action,
  onValueChange,
  autoComplete,
  required,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  placeholder: string;
  type?: string;
  action?: string;
  onValueChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-3">
      <span className="flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
        {label}
        {action && <span>{action}</span>}
      </span>
      <span className="flex min-h-[50px] items-center gap-3 rounded-md border border-line2 bg-void/72 px-4 text-sky-100/85 transition focus-within:border-[#F2A93B]/60">
        <Icon size={18} className="text-muted" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onValueChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-sky-100/45"
        />
        {type === "password" && <Eye size={17} className="text-muted" />}
      </span>
    </label>
  );
}

function Signal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-void/62 p-4">
      <Icon size={17} className={amber} />
      <span className="mt-3 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}

function ProvisionPanel() {
  const rows = [
    "$ cyberrange provision --seat analyst",
    "credential vault initialised",
    "scenario library mounted",
    "evidence workspace allocated",
    "debrief history encrypted",
  ];

  return (
    <Panel className="mt-8 max-w-xl p-5 font-mono text-sm">
      <div className="mb-5 flex items-center justify-between text-muted">
        <span>// onboarding.log</span>
        <span className="h-2 w-2 rounded-full bg-[#F2A93B] soft-pulse" />
      </div>
      {rows.map((row, index) => (
        <div key={row} className={`rise py-1.5 ${index === 0 ? "text-sky-100/80" : "text-leaf"}`} style={{ animationDelay: `${index * 70}ms` }}>
          {index === 0 ? row : `ok ${row}`}
        </div>
      ))}
    </Panel>
  );
}

function PasswordMeter({ password }: { password: string }) {
  const score = Math.min(5, Math.max(1, Math.ceil(password.length / 3)));

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((item) => (
          <span key={item} className={`h-1 rounded-full ${item <= score ? "bg-[#F2A93B]" : "bg-line2"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 font-mono text-[0.68rem] text-muted">
        <span>- 12+ chars</span>
        <span>- aA mix</span>
        <span>- number</span>
        <span>- symbol</span>
      </div>
    </div>
  );
}
