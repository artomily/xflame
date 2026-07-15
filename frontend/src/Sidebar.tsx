import type { ReactNode } from "react";
import type { Tab } from "./App";
import { FeedbackIcon } from "./icons";
import { FEEDBACK_FORM_URL } from "./config";

export default function Sidebar({
  tabs,
  active,
  onSelect,
  roadmap,
}: {
  tabs: { id: Tab; label: string; icon: ReactNode }[];
  active: Tab;
  onSelect: (t: Tab) => void;
  roadmap: { label: string; icon: ReactNode }[];
}) {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-none lg:flex-col lg:border-r lg:border-edge lg:bg-surface">
      <div className="flex items-center gap-2 border-b border-edge px-6 py-5">
        <img src="/ame.png" alt="Ame" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold tracking-tight">
          x<span className="text-brand">flame</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              active === t.id
                ? "bg-brand text-brand-fg"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-edge p-3">
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">
          Roadmap
        </p>
        {roadmap.map((r) => (
          <div
            key={r.label}
            className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted"
          >
            {r.icon}
            <span className="flex-1">{r.label}</span>
            <span className="rounded-full border border-edge bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              Soon
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-edge px-6 py-4">
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <FeedbackIcon />
          Send feedback
        </a>
        <span className="self-start rounded-full border border-edge bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-muted">
          Testnet
        </span>
        <p className="text-xs text-ink-muted">Runs on Stellar testnet · fueled by Ame</p>
      </div>
    </aside>
  );
}
