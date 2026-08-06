import type { ReactNode } from "react";
import type { Tab } from "./App";
import type { ActivityEntry, VaultState } from "./useVault";
import { symbolize, toStroops, toXlm } from "./lib/splitMath";
import { CoverageGauge, MiniGauge, SplitBarChart } from "./charts";
import {
  EMPTY,
  EMPTY_GOAL,
  GOAL_PHOTO,
  type DashboardData,
  type PocketRow,
  type PocketStatus,
  type Point,
} from "./demoData";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  CoinsIcon,
  PencilIcon,
  PrintIcon,
  SearchIcon,
  ShareIcon,
  SlidersIcon,
  SparkIcon,
  StarIcon,
  TargetIcon,
} from "./icons";

/* ---------- formatting ---------- */

const group = (whole: string) => whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Stroops → grouped XLM string, e.g. 12345600000n → "1,234.56". */
function fmtXlm(stroops: bigint) {
  const [w, f] = toXlm(stroops).split(".");
  return f ? `${group(w)}.${f}` : group(w);
}

function ago(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Deposits bucketed into the trailing seven days, oldest first. */
function weekSeries(activity: ActivityEntry[]): { series: Point[]; empty: boolean } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const series: Point[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { day: DAY_LABELS[d.getDay()], value: 0 };
  });

  let any = false;
  for (const a of activity) {
    if (a.kind !== "deposit") continue;
    const i = Math.floor((a.ts - start.getTime()) / 86_400_000);
    if (i < 0 || i > 6) continue;
    series[i].value += Number(a.amount) / 1e7;
    any = true;
  }
  return { series, empty: !any };
}

/* ---------- real vault state → the shape the cards render ---------- */

function realRows(vault: VaultState, lastSplit: string): PocketRow[] {
  const { pockets, mode, fixed, goals, totalBalance } = vault;
  const share = (v: bigint) => (totalBalance > 0n ? Number((v * 1000n) / totalBalance) / 10 : 0);

  return pockets.map(([name, balance]) => {
    if (mode === "fixed") {
      const r = fixed.find((f) => symbolize(f.pocket) === name);
      return {
        name,
        rule: r ? `${r.pct}% fixed` : "no rule",
        balance: fmtXlm(balance),
        sharePct: share(balance),
        lastSplit,
        status: (balance > 0n ? "funded" : "new") as PocketStatus,
      };
    }
    const g = goals.find((x) => symbolize(x.pocket) === name);
    const target = g ? toStroops(g.target) : 0n;
    return {
      name,
      rule: g ? `goal ${g.target} XLM` : "overflow",
      balance: fmtXlm(balance),
      sharePct: share(balance),
      lastSplit,
      status: (target > 0n && balance >= target ? "funded" : balance > 0n ? "filling" : "new") as PocketStatus,
    };
  });
}

function realFrom(vault: VaultState): DashboardData {
  const {
    activity, pockets, totalBalance, coveragePct,
    mode, pctTotal, overflow, ruleSaved, goals,
  } = vault;

  const { series, empty } = weekSeries(activity);
  const deposits = activity.filter((a) => a.kind === "deposit");
  const latest = deposits.at(-1);
  const previous = deposits.at(-2);

  // Only comparable once there are two deposits to compare.
  const deltaPct =
    latest && previous && previous.amount > 0n
      ? ((Number(latest.amount) - Number(previous.amount)) / Number(previous.amount)) * 100
      : null;

  const funded =
    mode === "goal"
      ? pockets.filter(([p, v]) => {
          const g = goals.find((x) => symbolize(x.pocket) === p);
          return g ? v >= toStroops(g.target) : false;
        }).length
      : pockets.filter(([, v]) => v > 0n).length;

  const rounded = Math.round(pctTotal);

  return {
    totalXlm: fmtXlm(totalBalance),
    deltaPct,
    statusLabel: !ruleSaved
      ? "No rule saved yet"
      : coveragePct >= 100
        ? "Splitting cleanly"
        : "Rule incomplete",
    series,
    seriesEmpty: empty,
    pocketCount: pockets.length,
    coveragePct,
    fundedCount: funded,
    statA:
      mode === "fixed"
        ? { label: "Routed per deposit", value: `${rounded}%` }
        : { label: "Goals met", value: `${coveragePct}%` },
    statB:
      mode === "fixed"
        ? { label: "Unallocated", value: `${Math.max(0, 100 - rounded)}%` }
        : { label: "Overflow pocket", value: overflow || "—" },
    insightCount: deposits.length,
    insightBody:
      "Ame reads your rule and every confirmed deposit, then reports how the funds divided — which pocket filled, which is still short, and where the next deposit lands.",
    insightNote: pockets.length
      ? `${funded} of ${pockets.length} pockets funded`
      : "Deposit once to see your split",
    updatedLabel: latest ? `Updated ${ago(latest.ts)}` : "No activity yet",
    rows: realRows(vault, latest ? ago(latest.ts) : "—"),
  };
}

/** Goal-pocket promo card content, derived from whichever pocket matters most. */
function goalCardFrom(vault: VaultState) {
  const { mode, pockets, goals, totalBalance } = vault;
  if (pockets.length === 0) {
    return { name: "No pockets yet", pct: 0, caption: "Save a rule to start", sub: "Waiting on a deposit" };
  }

  if (mode === "goal") {
    const next =
      goals
        .map((g) => {
          const bal = pockets.find(([p]) => p === symbolize(g.pocket))?.[1] ?? 0n;
          const target = toStroops(g.target);
          return { name: g.pocket, pct: target > 0n ? Number((bal * 100n) / target) : 0 };
        })
        .filter((g) => g.pct < 100)
        .sort((a, b) => b.pct - a.pct)[0] ?? null;
    if (next) {
      return { name: next.name, pct: Math.min(100, next.pct), caption: "Filled toward target", sub: "Priority pocket" };
    }
    return { name: "All goals met", pct: 100, caption: "Filled toward target", sub: "Overflow is collecting" };
  }

  const top = [...pockets].sort((a, b) => (b[1] > a[1] ? 1 : -1))[0];
  const pct = totalBalance > 0n ? Number((top[1] * 100n) / totalBalance) : 0;
  return { name: top[0], pct, caption: "Share of the vault", sub: "Largest pocket" };
}

/* ---------- shared card furniture ---------- */

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-2xl border border-edge bg-surface ${className}`}>{children}</section>;
}

function IconChip({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg" aria-hidden="true">
      {children}
    </span>
  );
}

function CardLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">{children}</h2>;
}

function RoundButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

function StatusPill({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "muted" }) {
  return (
    <span className="flex w-fit items-center gap-1.5 rounded-full border border-edge bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${tone === "success" ? "bg-success" : "bg-ink-muted"}`}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/** Big money figure — decimals drop back so the whole number leads. */
function Amount({ value, unit }: { value: string; unit: string }) {
  const [whole, frac] = value.split(/\.(?=[^.]*$)/);
  return (
    <p className="font-mono text-4xl font-bold tracking-tight tabular-nums text-ink">
      {whole}
      {frac !== undefined && <span className="text-ink-muted">.{frac}</span>}
      <span className="ml-1.5 text-base font-semibold text-ink-muted">{unit}</span>
    </p>
  );
}

const STATUS_STYLE: Record<PocketStatus, { label: string; dot: string; text: string }> = {
  funded: { label: "Funded", dot: "bg-success", text: "text-success" },
  filling: { label: "Filling", dot: "bg-brand", text: "text-brand" },
  new: { label: "New", dot: "bg-ink-muted", text: "text-ink-muted" },
};

/* ---------- onboarding ---------- */

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
    <Card className="flex flex-col gap-3 px-6 py-5">
      <CardLabel>Getting started</CardLabel>
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
          className="self-start rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Continue in Vault →
        </button>
      )}
    </Card>
  );
}

/* ---------- page ---------- */

export default function Dashboard({ vault, onNavigate }: { vault: VaultState; onNavigate?: (t: Tab) => void }) {
  const live = Boolean(vault.session);
  const d = live ? realFrom(vault) : EMPTY;
  const goal = live ? goalCardFrom(vault) : EMPTY_GOAL;

  const { pocketFilter, setPocketFilter } = vault;
  const rows = d.rows.filter((r) => r.name.toLowerCase().includes(pocketFilter.trim().toLowerCase()));

  const today = new Date();
  const dayMonth = today.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  return (
    <div className="flex w-full max-w-md flex-col gap-4 lg:max-w-none lg:gap-5">
      {/* Page title */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">Vault Dashboard</h1>
          <button
            type="button"
            onClick={() => onNavigate?.("vault")}
            aria-label="Edit split rule"
            title="Edit split rule"
            className="text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <PencilIcon size={20} />
          </button>
          {!live && (
            <span className="rounded-full border border-edge bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-muted">
              Not signed in
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <span className="flex items-center gap-2.5 rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-brand-fg">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-fg/15" aria-hidden="true">
              <CalendarIcon size={16} />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-medium">{dayMonth}</span>
              <span className="block font-mono text-[11px] text-brand-fg/60">{today.getFullYear()}</span>
            </span>
          </span>

          <span className="hidden items-center gap-2 sm:flex">
            <RoundButton label="Print this summary" onClick={() => window.print()}>
              <PrintIcon size={16} />
            </RoundButton>
            <RoundButton label="Favourite this vault">
              <StarIcon size={16} />
            </RoundButton>
          </span>

          {/* Vaults are single-owner until roadmap phase 5. */}
          {live ? (
            <span className="flex items-center gap-2 rounded-full border border-edge bg-surface py-1 pl-1 pr-3">
              <img src="/dino.png" alt="" className="h-7 w-7 rounded-full bg-canvas object-contain" />
              <span className="text-xs font-medium text-ink-muted">Only you</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate?.("vault")}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Sign in to view your vault
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate?.("send")}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ShareIcon size={16} />
            Send
          </button>
        </div>
      </div>

      <OnboardingChecklist vault={vault} onNavigate={onNavigate} />

      {/* items-stretch (default) keeps the two columns' bottoms aligned — the
          Pockets card below grows to fill any leftover height with flex-1. */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* ---- left rail ---- */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
          {/* Total split */}
          <Card className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3">
              <IconChip>
                <CoinsIcon size={18} />
              </IconChip>
              <CardLabel>Total split</CardLabel>
              <span className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-edge bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted">
                  This week
                  <ChevronDownIcon size={14} />
                </span>
                <RoundButton label="Open the vault" onClick={() => onNavigate?.("vault")}>
                  <ArrowUpRightIcon size={16} />
                </RoundButton>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Amount value={d.totalXlm} unit="XLM" />
              {d.deltaPct !== null && (
                <span
                  title="vs the previous deposit"
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    d.deltaPct >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}
                >
                  {d.deltaPct >= 0 ? "+" : ""}
                  {d.deltaPct.toFixed(1)}%
                </span>
              )}
              <span className="ml-auto">
                <StatusPill tone={d.statusLabel === "Splitting cleanly" ? "success" : "muted"}>
                  {d.statusLabel}
                </StatusPill>
              </span>
            </div>

            <SplitBarChart series={d.series} empty={d.seriesEmpty} />
          </Card>

          {/* Goal pocket promo */}
          <Card className="relative overflow-hidden p-0">
            <img
              src={GOAL_PHOTO}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-ink/25" aria-hidden="true" />

            <div className="relative flex min-h-[340px] flex-col gap-4 p-4">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.("vault")}
                  className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Add funds
                </button>
                <RoundButton label="Open the vault" onClick={() => onNavigate?.("vault")}>
                  <ArrowUpRightIcon size={16} />
                </RoundButton>
              </div>

              <div className="mt-auto w-full max-w-[320px] rounded-2xl bg-surface p-4">
                <h3 className="text-xl font-bold capitalize tracking-tight">{goal.name}</h3>
                <p className="mt-0.5 text-xs text-ink-muted">{goal.sub}</p>
                <div className="mt-3 flex items-center gap-4">
                  <p className="font-mono text-3xl font-bold tabular-nums">
                    {d.pocketCount}
                    <span className="text-brand">+</span>
                  </p>
                  <p className="text-xs leading-tight text-ink-muted">
                    Pockets
                    <br />
                    splitting together
                  </p>
                </div>
                <div className="mt-3 flex justify-center rounded-xl bg-canvas py-3">
                  <MiniGauge pct={goal.pct} caption={goal.caption} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ---- right region ---- */}
        <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-5">
          <div className="grid gap-4 lg:grid-cols-7 lg:gap-5">
            {/* Pocket coverage */}
            <Card className="flex flex-col gap-4 p-5 lg:col-span-4">
              <div className="flex items-center gap-3">
                <IconChip>
                  <TargetIcon size={18} />
                </IconChip>
                <CardLabel>Pocket coverage</CardLabel>
                <span className="ml-auto">
                  <RoundButton label="Open the vault" onClick={() => onNavigate?.("vault")}>
                    <ArrowUpRightIcon size={16} />
                  </RoundButton>
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                {[
                  { label: "Configured", cls: "bg-brand-soft" },
                  { label: "Funded", cls: "bg-brand" },
                  { label: "Pending", cls: "bg-surface-mid" },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${l.cls}`} aria-hidden="true" />
                    {l.label}
                  </span>
                ))}
              </div>

              <div className="flex justify-center">
                <CoverageGauge
                  pct={d.coveragePct}
                  total={String(d.pocketCount)}
                  totalLabel="Pockets"
                  markLabel="Funded"
                  markValue={String(d.fundedCount)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[d.statA, d.statB].map((s) => (
                  <div key={s.label} className="rounded-xl border border-edge bg-canvas px-3 py-2.5">
                    <p className="text-[11px] text-ink-muted">{s.label}</p>
                    <p className="mt-0.5 truncate font-mono text-lg font-semibold tabular-nums text-ink">{s.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ame insight */}
            <Card className="flex flex-col gap-3 p-5 lg:col-span-3">
              <div className="flex items-center gap-3">
                <IconChip>
                  <SparkIcon size={18} />
                </IconChip>
                <CardLabel>Ame insight</CardLabel>
              </div>

              <hr className="border-edge" />

              <div className="flex items-start justify-between gap-2">
                <span>
                  <p className="font-mono text-5xl font-bold tracking-tight tabular-nums text-ink">
                    {d.insightCount}
                    <span className="text-brand">+</span>
                  </p>
                  <p className="text-xs text-ink-muted">splits read</p>
                </span>
                <img src="/dino.png" alt="Ame's dino" className="ame-float h-16 w-16 shrink-0 object-contain" />
              </div>

              <StatusPill tone={d.insightCount > 0 ? "success" : "muted"}>{d.insightNote}</StatusPill>

              <p className="text-sm leading-relaxed text-ink-muted">{d.insightBody}</p>

              <p className="mt-auto pt-2 text-right text-xs text-ink-muted">{d.updatedLabel}</p>
            </Card>
          </div>

          {/* Pockets table — flex-1 lets it absorb any leftover height so this
              column's bottom edge lines up with the promo card opposite it. */}
          <Card className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <IconChip>
                <CoinsIcon size={18} />
              </IconChip>
              <CardLabel>Pockets</CardLabel>

              <span className="ml-auto flex items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-edge bg-canvas px-3 py-2">
                  <span className="text-ink-muted" aria-hidden="true">
                    <SearchIcon size={16} />
                  </span>
                  <span className="sr-only">Search pockets</span>
                  <input
                    value={pocketFilter}
                    onChange={(e) => setPocketFilter(e.target.value)}
                    placeholder="Search"
                    className="w-24 bg-transparent text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none sm:w-40"
                  />
                </label>
                <RoundButton label="Clear the pocket filter" onClick={() => setPocketFilter("")}>
                  <SlidersIcon size={16} />
                </RoundButton>
                <RoundButton label="Manage pockets in the Vault" onClick={() => onNavigate?.("vault")}>
                  <ArrowUpRightIcon size={16} />
                </RoundButton>
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                {d.rows.length === 0
                  ? "No pockets yet — head to the Vault tab to set a rule and deposit."
                  : `No pockets match "${pocketFilter}".`}
              </p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                    <th scope="col" className="pb-2 pr-4 font-medium">Name</th>
                    <th scope="col" className="hidden pb-2 pr-4 font-medium sm:table-cell">Rule</th>
                    <th scope="col" className="pb-2 pr-4 font-medium">Balance</th>
                    <th scope="col" className="hidden pb-2 pr-4 font-medium md:table-cell">Share</th>
                    <th scope="col" className="hidden pb-2 pr-4 font-medium sm:table-cell">Last split</th>
                    <th scope="col" className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const s = STATUS_STYLE[r.status];
                    return (
                      <tr key={r.name} className="border-t border-edge">
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2.5">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold uppercase text-brand"
                              aria-hidden="true"
                            >
                              {r.name.slice(0, 2)}
                            </span>
                            <span className="font-medium capitalize text-ink">{r.name}</span>
                          </span>
                        </td>
                        <td className="hidden py-3 pr-4 text-sm text-ink-muted sm:table-cell">{r.rule}</td>
                        <td className="whitespace-nowrap py-3 pr-4 font-mono text-sm font-semibold tabular-nums text-ink">
                          {r.balance} <span className="text-xs font-normal text-ink-muted">XLM</span>
                        </td>
                        <td className="hidden py-3 pr-4 md:table-cell">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-mid" aria-hidden="true">
                              <span
                                className="block h-full rounded-full bg-brand"
                                style={{ width: `${Math.min(100, r.sharePct)}%` }}
                              />
                            </span>
                            <span className="font-mono text-xs tabular-nums text-ink-muted">{r.sharePct}%</span>
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap py-3 pr-4 text-sm text-ink-muted sm:table-cell">{r.lastSplit}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pinned to the bottom via mt-auto — closes any leftover space
                from the flex-1 stretch above with a real summary, not blank
                padding. Totals the whole vault, independent of the search filter. */}
            {d.rows.length > 0 && (
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-3 text-sm">
                <span className="text-ink-muted">
                  Total across {d.pocketCount} pocket{d.pocketCount === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {d.totalXlm} <span className="text-xs font-normal text-ink-muted">XLM</span>
                  </span>
                  <StatusPill tone={d.fundedCount === d.pocketCount ? "success" : "muted"}>
                    {d.fundedCount}/{d.pocketCount} funded
                  </StatusPill>
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
