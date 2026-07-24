import {
  Activity,
  Database,
  FileKey,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../auth";
import type { Navigate, NavItem, Page } from "../../types";
import { GhostButton, SolidButton } from "../ui/Button";
import { Brand } from "./Brand";

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Activity },
  { id: "scenarios", label: "Scenarios", icon: Database },
  { id: "workspace", label: "Workspace", icon: LayoutDashboard },
  { id: "evidence", label: "Evidence", icon: FileKey },
  { id: "debrief", label: "Debrief", icon: Gauge },
];

export function TopBar({ page, navigate }: { page: Page; navigate: Navigate }) {
  const { isAuthenticated, logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("home");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-void/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[70px] w-[calc(100%_-_2rem)] max-w-[1440px] items-center justify-between gap-4">
        <button type="button" onClick={() => navigate("home")} className="shrink-0 rounded-md focus-visible:app-focus">
          <Brand compact />
        </button>

        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-md border border-line bg-panel/72 p-1 md:mx-auto md:max-w-3xl md:justify-center">
          {(isAuthenticated ? navItems : navItems.filter((item) => item.id === "home")).map(
            ({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex min-h-9 shrink-0 items-center gap-2 rounded px-3 text-sm font-bold transition focus-visible:app-focus ${
                  page === id ? "bg-cyan/12 text-cyan ring-1 ring-cyan/25" : "text-muted hover:bg-void/65 hover:text-text"
                }`}
              >
                <Icon size={15} className={page === id ? "text-cyan" : ""} />
                {label}
              </button>
            ),
          )}
        </nav>

        {!isAuthenticated && (
          <div className="hidden flex-1 justify-center font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted xl:flex">
            Evidence-first incident training
          </div>
        )}

        {isAuthenticated ? (
          <div className="hidden items-center gap-3 lg:flex">
            <div className="max-w-48 truncate rounded-md border border-line bg-panel/60 px-3 py-2 text-right">
              <span className="block truncate text-sm font-bold">{user?.display_name ?? user?.username}</span>
              <span className="block font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">{user?.role}</span>
            </div>
            <GhostButton onClick={handleLogout} icon={LogOut} className="min-h-10 px-4">
              Logout
            </GhostButton>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <GhostButton
              onClick={() => navigate("login")}
              icon={KeyRound}
              className="min-h-10 px-3 sm:px-4"
            >
              Log in
            </GhostButton>
            <SolidButton
              onClick={() => navigate("signup")}
              icon={UserPlus}
              className="hidden min-h-10 px-4 sm:inline-flex"
            >
              Start Training
            </SolidButton>
          </div>
        )}

      </div>
    </header>
  );
}
