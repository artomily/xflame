import type { ReactNode } from "react";
import type { Tab } from "./App";
import { BellIcon, GearIcon } from "./icons";
import { FEEDBACK_FORM_URL } from "./config";

/** Circular icon button — the reference's secondary nav affordance. */
function CircleButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-edge transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        active ? "bg-brand text-brand-fg" : "bg-surface text-ink-muted"
      } ${disabled ? "cursor-default opacity-40" : "hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

export default function Topbar({
  tabs,
  active,
  onSelect,
  sessionLabel,
}: {
  tabs: { id: Tab; label: string; icon: ReactNode }[];
  active: Tab;
  onSelect: (t: Tab) => void;
  sessionLabel: string;
}) {
  return (
    <header className="hidden items-center gap-4 lg:flex">
      {/* Brand */}
      <span className="flex shrink-0 items-center gap-2">
        <img src="/ame.png" alt="Ame" className="h-9 w-9 object-contain" />
        <span className="text-xl font-bold tracking-tight">
          x<span className="text-brand">flame</span>
        </span>
      </span>

      {/*
        Nav — fixed tab order, always. Earlier this rendered the active tab
        as a separate pill *first* and the rest after, so every switch
        reshuffled the whole row instead of animating; keeping one button per
        tab in place and transitioning only the properties that change
        (background, text colour, padding) lets each toggle animate in place.
      */}
      <nav className="mx-auto flex items-center" aria-label="Sections">
        <span className="flex items-center gap-1.5 rounded-full bg-surface p-1.5">
          {tabs.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={t.label}
                title={t.label}
                className={`flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,color,padding] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? "bg-ink px-4 text-brand-fg"
                    : "w-10 border border-edge bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {t.icon}
                {isActive && t.label}
              </button>
            );
          })}
        </span>
      </nav>

      {/* Account */}
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Send feedback"
          title="Send feedback"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <GearIcon />
        </a>

        <span className="relative">
          <CircleButton label="Notifications">
            <BellIcon />
          </CircleButton>
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-canvas" aria-hidden="true" />
        </span>

        <span className="flex items-center gap-2.5 rounded-full border border-edge bg-surface py-1.5 pl-1.5 pr-4">
          <img src="/dino.png" alt="" className="h-8 w-8 rounded-full bg-canvas object-contain" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink">
              {sessionLabel ? "Signed in" : "Guest"}
            </span>
            <span className="block max-w-[140px] truncate font-mono text-[11px] text-ink-muted">
              {sessionLabel || "not connected"}
            </span>
          </span>
        </span>
      </div>
    </header>
  );
}
