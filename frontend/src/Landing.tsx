import { VaultIcon, FaucetIcon, SendIcon, AutoTriggerIcon, OffRampIcon, AccountSafetyIcon, ScaleIcon } from "./icons";

const LIVE_DEMO = "https://youtu.be/kdpUCG3ZmGs";

/* ---------- content ---------- */

const STEPS = [
  { n: "1", title: "Set a rule once", body: "Pick Fixed percentages or priority-ordered Goals. You define how income should divide — just once." },
  { n: "2", title: "Income lands", body: "Stablecoin arrives from family abroad. No bank account, no custodian in the middle." },
  { n: "3", title: "It auto-splits", body: "Every deposit is divided across your pockets on-chain — stability, DCA, and spendable cash." },
];

const SPLIT_EXAMPLE = [
  { label: "Stability", pct: 50 },
  { label: "DCA", pct: 30 },
  { label: "Cash", pct: 20 },
];

const FEATURES = [
  { icon: <VaultIcon />, title: "Vault", body: "The auto-split vault. Pick Fixed or Goal mode, build your rule, and watch a live preview of how any deposit divides across pockets." },
  { icon: <FaucetIcon />, title: "Faucet", body: "Fund any Stellar testnet address with 10,000 XLM in one click — calls Friendbot directly, no contract needed." },
  { icon: <SendIcon />, title: "Send", body: "Plain XLM transfer to any testnet address, straight from your linked wallet." },
];

const ROADMAP = [
  { icon: <VaultIcon />, phase: "Phase 1", title: "Validate & MVP", body: "Split engine (Fixed + Goal), manual deposit, Freighter + email demo sign-in.", here: true },
  { icon: <AutoTriggerIcon />, phase: "Phase 2", title: "Income-triggered", body: "Split the moment funds land via streaming and remittance rails.", here: false },
  { icon: <OffRampIcon />, phase: "Phase 3", title: "Off-ramp", body: "Cash out to Rupiah / e-wallet.", here: false },
  { icon: <AccountSafetyIcon />, phase: "Phase 4", title: "Account safety", body: "Guardian-based multi-sig recovery for non-crypto-native users.", here: false },
  { icon: <ScaleIcon />, phase: "Phase 5", title: "Scale", body: "Shared household vaults; expand to other SEA remittance corridors.", here: false },
];

/* ---------- full-bleed band: background spans the viewport, content is centered ---------- */

type Tone = "canvas" | "surface" | "ink";

function Band({ children, tone = "canvas", className = "", delay = 0 }: { children: React.ReactNode; tone?: Tone; className?: string; delay?: number }) {
  const bg = tone === "surface" ? "bg-surface" : tone === "ink" ? "bg-ink text-brand-fg" : "bg-canvas";
  return (
    <section className={`w-full ${bg}`}>
      <div className={`fade-up mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`} style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-ink-muted">{children}</p>;
}

/* ---------- component ---------- */

export default function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-svh bg-canvas text-ink">
      {/* Top nav — full-width bar, centered content */}
      <header className="sticky top-0 z-20 w-full border-b border-edge bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <span className="flex items-center gap-2">
            <img src="/ame.png" alt="Ame" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              x<span className="text-brand">flame</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:inline">
              Testnet
            </span>
            <button
              type="button"
              onClick={onEnter}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Try it now
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Band tone="canvas" className="flex flex-col items-center gap-6 pb-20 pt-16 text-center sm:pt-24">
        <img src="/dino.png" alt="" className="ame-float h-28 w-28 object-contain sm:h-36 sm:w-36" />
        <span className="rounded-full border border-edge bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
          Phase 1 MVP · Stellar / Soroban testnet
        </span>
        <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          The moment stablecoin income lands, it&rsquo;s{" "}
          <span className="text-brand">auto-split</span> into a stability vault, a DCA basket, and spendable cash.
        </h1>
        <p className="max-w-xl text-base text-ink-muted sm:text-lg">
          Instead of sitting idle even a minute. Define a split rule once — every deposit divides across your pockets automatically, on-chain, with near-zero fees.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEnter}
            className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Try it now
          </button>
          <a
            href={LIVE_DEMO}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-edge bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Watch demo
          </a>
        </div>
      </Band>

      {/* How it works — surface band, canvas cards */}
      <Band tone="surface" className="py-16" delay={80}>
        <SectionLabel>How it works</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-edge bg-canvas p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg tabular-nums">
                {s.n}
              </span>
              <p className="text-base font-semibold text-ink">{s.title}</p>
              <p className="text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* Split illustration — canvas band, ink card */}
      <Band tone="canvas" className="py-16" delay={80}>
        <div className="mx-auto max-w-3xl rounded-2xl bg-ink p-6 text-brand-fg sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider">Fixed split · 50 / 30 / 20</span>
            <span className="rounded-full bg-brand-fg/10 px-2.5 py-1 text-[11px] font-medium">Example</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="font-mono font-semibold tabular-nums">100 XLM</span>
            <span className="text-brand-fg/60">income</span>
            <span className="ml-auto text-brand-fg/60">splits into ↓</span>
          </div>
          {/* Proportional bar */}
          <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full">
            {SPLIT_EXAMPLE.map((p, i) => (
              <div
                key={p.label}
                style={{ width: `${p.pct}%`, backgroundColor: "var(--color-brand)", opacity: 0.4 + i * 0.3 }}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {SPLIT_EXAMPLE.map((p) => (
              <div key={p.label} className="rounded-xl bg-brand-fg/5 p-3">
                <p className="text-xs text-brand-fg/60">{p.label}</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {p.pct} <span className="text-xs font-normal text-brand-fg/50">XLM</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-brand-fg/50">
            Balances always preserved — the sum credited across pockets equals the deposit. Goal mode tops up priority goals in order, with overflow to spendable cash.
          </p>
        </div>
      </Band>

      {/* Features — surface band, canvas cards */}
      <Band tone="surface" className="py-16" delay={80}>
        <SectionLabel>What&rsquo;s inside</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 rounded-2xl border border-edge bg-canvas p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-brand">
                {f.icon}
              </span>
              <p className="text-base font-semibold text-ink">{f.title}</p>
              <p className="text-sm text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* Roadmap — canvas band, surface cards */}
      <Band tone="canvas" className="py-16" delay={80}>
        <SectionLabel>Roadmap</SectionLabel>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {ROADMAP.map((r) => (
            <div
              key={r.phase}
              className={`flex items-start gap-4 rounded-2xl border bg-surface p-5 ${r.here ? "border-brand" : "border-edge"}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.here ? "bg-brand text-brand-fg" : "bg-canvas text-ink-muted"}`}>
                {r.icon}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">{r.phase}</span>
                  <span className="text-base font-semibold text-ink">{r.title}</span>
                  {r.here ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-fg">You are here</span>
                  ) : (
                    <span className="rounded-full border border-edge bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Soon</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Band>

      {/* Final CTA — full-width ink band */}
      <Band tone="ink" className="flex flex-col items-center gap-5 py-16 text-center" delay={80}>
        <img src="/ame.png" alt="" className="ame-bob h-14 w-14 object-contain" />
        <h2 className="max-w-md text-2xl font-bold tracking-tight sm:text-3xl">Try the split engine on testnet</h2>
        <p className="max-w-md text-sm text-brand-fg/70">No sign-up needed. Sign in with an email demo account or Freighter, fund it from the faucet, and watch a deposit split.</p>
        <button
          type="button"
          onClick={onEnter}
          className="rounded-lg bg-brand-fg px-6 py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fg"
        >
          Try it now
        </button>
      </Band>

      {/* Footer */}
      <footer className="w-full border-t border-edge bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-8 text-center sm:px-8">
          <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted">Testnet</span>
          <p className="text-xs text-ink-muted">Runs on Stellar testnet · fueled by Ame</p>
        </div>
      </footer>
    </div>
  );
}
