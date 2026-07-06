import { useState, type ReactNode } from "react";
import Faucet from "./Faucet";
import Send from "./Send";
import Split from "./Split";

type Tab = "vault" | "faucet" | "send";

function VaultIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 L12 3" />
      <path d="M12 12 L20.5 14.5" />
    </svg>
  );
}

function FaucetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5S5.5 10 5.5 15a6.5 6.5 0 0 0 13 0c0-5-6.5-12.5-6.5-12.5z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "vault", label: "Vault", icon: <VaultIcon /> },
  { id: "faucet", label: "Faucet", icon: <FaucetIcon /> },
  { id: "send", label: "Send", icon: <SendIcon /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("vault");

  return (
    <main className="flex min-h-svh flex-col bg-canvas text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur">
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

          <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:hidden">
            Testnet
          </span>
        </div>
      </header>

      {/* Page content — bottom padding clears the mobile nav */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10">
        {tab === "vault" && <Split />}
        {tab === "faucet" && <Faucet />}
        {tab === "send" && <Send />}
      </div>

      {/* Footer (desktop) */}
      <footer className="hidden pb-6 text-center text-xs text-ink-muted sm:block">
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
