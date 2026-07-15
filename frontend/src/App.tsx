import { useState, type ReactNode } from "react";
import Faucet from "./Faucet";
import Send from "./Send";
import Split from "./Split";
import Dashboard from "./Dashboard";
import Sidebar from "./Sidebar";
import Landing from "./Landing";
import { useVault } from "./useVault";
import {
  DashboardIcon,
  VaultIcon,
  FaucetIcon,
  SendIcon,
  AutoTriggerIcon,
  OffRampIcon,
  AccountSafetyIcon,
  ScaleIcon,
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

// Phases 2-5 of the roadmap — not built yet, shown for context only.
const ROADMAP: { label: string; icon: ReactNode }[] = [
  { label: "Auto-trigger", icon: <AutoTriggerIcon /> },
  { label: "Off-ramp", icon: <OffRampIcon /> },
  { label: "Account safety", icon: <AccountSafetyIcon /> },
  { label: "Scale", icon: <ScaleIcon /> },
];

export default function App() {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const vault = useVault();

  if (!entered) return <Landing onEnter={() => setEntered(true)} />;

  return (
    <main className="flex min-h-svh flex-col bg-canvas text-ink lg:flex-row">
      <Sidebar tabs={TABS} active={tab} onSelect={setTab} roadmap={ROADMAP} />

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2">
            <img src="/ame.png" alt="Ame" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              x<span className="text-brand">flame</span>
            </span>
          </span>

          {/* Desktop tabs */}
          <nav className="hidden gap-1 rounded-lg border border-edge bg-surface p-1 sm:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:max-w-none lg:items-stretch lg:px-10 lg:pb-10 lg:pt-10">
        {tab === "dashboard" && <Dashboard vault={vault} onNavigate={setTab} />}
        {tab === "vault" && <Split vault={vault} />}
        {tab === "faucet" && <Faucet />}
        {tab === "send" && <Send />}
      </div>

      {/* Footer (desktop) */}
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
              onClick={() => setTab(t.id)}
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
