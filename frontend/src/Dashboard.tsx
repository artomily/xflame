import type { Tab } from "./App";
import type { VaultState } from "./useVault";
import { toXlm } from "./lib/splitMath";

/* ---------- small dashboard widgets ---------- */

function RingProgress({ pct }: { pct: number }) {
  const size = 104;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = (clamped / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-brand-fg)" strokeOpacity="0.15" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand-soft)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums">{clamped}%</span>
      </div>
    </div>
  );
}

function NestedCircles({ items, unit }: { items: { label: string; value: number }[]; unit: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-xs text-ink-muted">Add pockets in the Vault tab to see the allocation.</p>;
  }
  const denom = Math.max(items.length - 1, 1);
  const rings = items.map((it, i) => {
    const opacity = items.length === 1 ? 0.35 : 0.22 + (i / denom) * 0.55;
    return { ...it, size: 100 - i * (60 / denom), opacity, light: opacity > 0.5 };
  });
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {rings.map((r, i) => (
        <div
          key={r.label + i}
          className="absolute rounded-full"
          style={{ width: `${r.size}%`, height: `${r.size}%`, backgroundColor: "var(--color-brand)", opacity: r.opacity }}
        />
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2">
        {rings.map((r) => (
          <span
            key={r.label}
            className={`text-xs font-semibold tabular-nums ${r.light ? "text-brand-fg" : "text-ink"}`}
          >
            {r.value}
            {unit} <span className={`font-normal ${r.light ? "text-brand-fg/70" : "text-ink-muted/80"}`}>{r.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 rounded-2xl border border-edge bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="font-mono text-xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

/* ---------- component ---------- */

function OnboardingChecklist({ vault, onNavigate }: { vault: VaultState; onNavigate?: (t: Tab) => void }) {
  const { session, ruleSaved, hasDeposited } = vault;
  if (hasDeposited) return null;

  const steps = [
    { done: Boolean(session), label: "Sign in", hint: "Email or Freighter — no seed phrase needed" },
    { done: ruleSaved, label: "Save a split rule", hint: "Fixed percentages or priority goals" },
    { done: hasDeposited, label: "Make your first deposit", hint: "Watch it split into pockets on-chain" },
  ];
  const nextStep = steps.findIndex((s) => !s.done);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface px-6 py-5 lg:col-span-12">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Getting started</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                s.done ? "bg-success text-brand-fg" : i === nextStep ? "bg-brand text-brand-fg" : "bg-surface-mid text-ink-muted"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div>
              <p className={`text-sm font-medium ${s.done ? "text-ink-muted line-through" : "text-ink"}`}>{s.label}</p>
              <p className="text-xs text-ink-muted">{s.hint}</p>
            </div>
          </div>
        ))}
      </div>
      {nextStep >= 0 && (
        <button
          type="button"
          onClick={() => onNavigate?.("vault")}
          className="self-start rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-fg hover:opacity-90"
        >
          Continue in Vault →
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ vault, onNavigate }: { vault: VaultState; onNavigate?: (t: Tab) => void }) {
  const {
    session, sessionLabel, mode, coveragePct, totalBalance, pockets, configuredCount,
    nestedItems, pocketFilter, setPocketFilter, filteredPockets,
  } = vault;

  return (
    <div className="flex w-full max-w-md flex-col gap-4 lg:max-w-6xl lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
      <OnboardingChecklist vault={vault} onNavigate={onNavigate} />

      {/* Greeting bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface px-6 py-5 lg:col-span-12 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <img src="/dino.png" alt="" className="ame-float h-12 w-12 object-contain" />
          <div>
            <p className="text-lg font-bold tracking-tight">Hey, need a hand?</p>
            <p className="text-sm text-ink-muted">Ask Ame to split, send, or top up your vault.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-edge bg-canvas px-4 py-2 lg:ml-auto lg:w-full lg:max-w-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={pocketFilter}
            onChange={(e) => setPocketFilter(e.target.value)}
            placeholder="Search pockets…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
        </div>
        {session ? (
          <span className="flex shrink-0 items-center gap-2 self-start rounded-full border border-edge bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted lg:self-auto">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            {sessionLabel}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate?.("vault")}
            className="shrink-0 self-start rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg hover:opacity-90 lg:self-auto"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Vault hero card */}
      <div className="flex flex-col justify-between gap-6 rounded-2xl bg-ink p-6 text-brand-fg lg:col-span-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider">xflame vault</span>
          <span className="rounded-full bg-brand-fg/10 px-2.5 py-1 text-[11px] font-medium capitalize">{mode} split</span>
        </div>
        <div>
          <p className="text-xs text-brand-fg/60">{session ? "Linked wallet" : "Not connected"}</p>
          <p className="mt-1 font-mono text-lg">{session ? sessionLabel : "— sign in to link —"}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onNavigate?.("faucet")} className="flex-1 rounded-lg bg-brand-fg py-2.5 text-sm font-semibold text-ink hover:opacity-90">
            Receive
          </button>
          <button type="button" onClick={() => onNavigate?.("send")} className="flex-1 rounded-lg border border-brand-fg/30 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-fg/10">
            Send
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-brand-fg/15 pt-3 text-xs">
          <span className="text-brand-fg/60">{coveragePct}% {mode === "fixed" ? "allocated" : "goals met"}</span>
          <button type="button" onClick={() => onNavigate?.("vault")} className="font-medium text-brand-fg underline underline-offset-2">
            Edit rule
          </button>
        </div>
      </div>

      {/* Stat stack */}
      <div className="flex flex-col gap-4 lg:col-span-3">
        <StatCard label="Total balance" value={`${toXlm(totalBalance)} XLM`} sub={`${pockets.length} pocket${pockets.length === 1 ? "" : "s"}`} />
        <StatCard label="Pockets funded" value={`${pockets.length} / ${configuredCount || pockets.length}`} sub="vs. configured" />
      </div>

      {/* Coverage ring */}
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-ink p-6 text-brand-fg lg:col-span-4">
        <RingProgress pct={coveragePct} />
        <p className="text-xs text-brand-fg/70">{mode === "fixed" ? "Allocated" : "Goals met"}</p>
      </div>

      {/* Split allocation */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface p-5 lg:col-span-4">
        <p className="self-start text-xs font-medium uppercase tracking-wider text-ink-muted">Split allocation</p>
        <NestedCircles items={nestedItems} unit={mode === "fixed" ? "%" : ""} />
      </div>

      {/* Pockets snapshot */}
      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4 lg:col-span-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Pockets snapshot</p>
          <button type="button" onClick={() => onNavigate?.("vault")} className="text-xs font-medium text-brand hover:underline">
            Manage in Vault →
          </button>
        </div>
        {pockets.length === 0 ? (
          <p className="py-2 text-center text-sm text-ink-muted">No pockets yet — head to the Vault tab to set a rule and deposit.</p>
        ) : filteredPockets.length === 0 ? (
          <p className="py-2 text-center text-sm text-ink-muted">No pockets match "{pocketFilter}".</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredPockets.map(([p, v]) => (
              <div key={p} className="flex items-center justify-between rounded-lg border border-edge bg-canvas px-3 py-2.5">
                <span className="font-medium text-ink">{p}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {toXlm(v)} <span className="text-xs font-normal text-ink-muted">XLM</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
