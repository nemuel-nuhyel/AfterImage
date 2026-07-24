import { Navigate as RouterNavigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { Navigate, Page } from "./types";
import { Atmosphere } from "./components/layout/Atmosphere";
import { TopBar } from "./components/layout/TopBar";
import { ProtectedRoute, UserRole } from "./auth";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ScenarioLibraryPage } from "./pages/ScenarioLibraryPage";
import { ScenarioBriefingPage } from "./pages/ScenarioBriefingPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { EvidencePage } from "./pages/EvidencePage";
import { ReportPage } from "./pages/ReportPage";
import { DebriefPage } from "./pages/DebriefPage";
import { StudioPage } from "./pages/StudioPage";

function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const currentPage = pathToPage(location.pathname);
  const navigate: Navigate = (page) => routerNavigate(pageToPath(page));

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-text">
      <Atmosphere />
      <TopBar page={currentPage} navigate={navigate} />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage navigate={navigate} />} />
          <Route path="/login" element={<LoginPage navigate={navigate} />} />
          <Route path="/signup" element={<SignupPage navigate={navigate} />} />
          <Route
            path="/scenarios"
            element={
              <ProtectedRoute>
                <ScenarioLibraryPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scenarios/:id"
            element={
              <ProtectedRoute>
                <ScenarioBriefingPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:sessionId"
            element={
              <ProtectedRoute>
                <WorkspacePage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/:sessionId"
            element={
              <ProtectedRoute>
                <EvidencePage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:sessionId"
            element={
              <ProtectedRoute>
                <ReportPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debrief/:sessionId"
            element={
              <ProtectedRoute>
                <DebriefPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio"
            element={
              <ProtectedRoute requiredRoles={[UserRole.reviewer, UserRole.admin]}>
                <StudioPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<RouterNavigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function pageToPath(page: Page) {
  const paths: Record<Page, string> = {
    home: "/",
    login: "/login",
    signup: "/signup",
    scenarios: "/scenarios",
    briefing: "/scenarios/ssh_reconnaissance",
    workspace: "/workspace/demo-session",
    evidence: "/evidence/demo-session",
    report: "/report/demo-session",
    debrief: "/debrief/demo-session",
    studio: "/studio",
  };
  return paths[page];
}

function pathToPage(pathname: string): Page {
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/signup")) return "signup";
  if (pathname.startsWith("/workspace")) return "workspace";
  if (pathname.startsWith("/evidence")) return "evidence";
  if (pathname.startsWith("/report")) return "report";
  if (pathname.startsWith("/debrief")) return "debrief";
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/scenarios/")) return "briefing";
  if (pathname.startsWith("/scenarios")) return "scenarios";
  return "home";
}

export default App;
