import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Faucet from "./Faucet";
import Send from "./Send";
import Split from "./Split";
import Dashboard from "./Dashboard";
import Topbar from "./Topbar";
import Landing from "./Landing";
import OnboardingModal from "./OnboardingModal";
import { useVault } from "./useVault";
import {
  DashboardIcon,
  VaultIcon,
  FaucetIcon,
  SendIcon,
  FeedbackIcon,
} from "./icons";
import { FEEDBACK_FORM_URL } from "./config";

export type Tab = "dashboard" | "vault" | "faucet" | "send";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "vault", label: "Vault", icon: <VaultIcon /> },
  { id: "faucet", label: "Faucet", icon: <FaucetIcon /> },
  { id: "send", label: "Send", icon: <SendIcon /> },
];
const TAB_IDS = TABS.map((t) => t.id);

const ONBOARDING_SEEN_KEY = "xflame-onboarding-seen";

/** `/` — marketing page. "Try it now" pushes into the app at `/app/dashboard`. */
function LandingRoute() {
  const navigate = useNavigate();
  return <Landing onEnter={() => navigate("/app/dashboard")} />;
}

/**
 * `/app/*` — chrome + tabs. One `useVault` instance backs every tab here so
 * session/rule/pocket state survives switching tabs or deep-linking straight
 * into e.g. `/app/send`.
 */
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const vault = useVault();
  // Lazy initializer reads localStorage once on mount — no effect needed.
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_SEEN_KEY));

  const segment = location.pathname.split("/")[2];
  const tab: Tab = (TAB_IDS as string[]).includes(segment) ? (segment as Tab) : "dashboard";

  // Canonicalize "/app" and unknown sub-paths to "/app/dashboard".
  useEffect(() => {
    if (segment !== tab) navigate(`/app/${tab}`, { replace: true });
  }, [segment, tab, navigate]);

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    setShowOnboarding(false);
  }

  function goTo(t: Tab) {
    navigate(`/app/${t}`);
  }

  return (
    <main className="min-h-svh bg-mat text-ink lg:p-6">
      {showOnboarding && <OnboardingModal onClose={dismissOnboarding} />}

      {/* From lg up the app sits on the mat as one full-width rounded panel. */}
      <div className="mx-auto flex min-h-svh w-full flex-col bg-canvas lg:min-h-0 lg:rounded-[32px] lg:p-6 lg:shadow-sm">
        <Topbar
          tabs={TABS}
          active={tab}
          onSelect={goTo}
          sessionLabel={vault.sessionLabel}
        />

        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <span className="flex items-center gap-2">
              <img src="/ame.png" alt="Ame" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold tracking-tight">
                x<span className="text-brand">flame</span>
              </span>
            </span>

            {/* Tablet tabs */}
            <nav className="hidden gap-1 rounded-lg border border-edge bg-surface p-1 sm:flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => goTo(t.id)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    tab === t.id
                      ? "bg-brand text-brand-fg"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <span className="flex items-center gap-3 sm:hidden">
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Send feedback"
                className="text-ink-muted hover:text-ink"
              >
                <FeedbackIcon />
              </a>
              <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                Testnet
              </span>
            </span>
          </div>
        </header>

        {/* Page content — bottom padding clears the mobile nav */}
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:max-w-none lg:items-stretch lg:px-0 lg:pb-0 lg:pt-6">
          {tab === "dashboard" && <Dashboard vault={vault} onNavigate={goTo} />}
          {tab === "vault" && <Split vault={vault} />}
          {tab === "faucet" && <Faucet />}
          {tab === "send" && <Send />}
        </div>
      </div>

      {/* Footer (tablet) */}
      <footer className="hidden flex-col items-center gap-2 pb-6 text-center text-xs text-ink-muted sm:flex lg:hidden">
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-medium text-ink-muted hover:text-ink"
        >
          <FeedbackIcon />
          Send feedback
        </a>
        Runs on Stellar testnet · fueled by Ame
      </footer>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-edge bg-surface/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTo(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                tab === t.id ? "text-brand" : "text-ink-muted"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/app/*" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
