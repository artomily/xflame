import { useState, type FormEvent } from "react";
import { connectFreighterSession, signInWithEmailDemo, createSplitterClient, SPLITTER_ID, type WalletSession } from "./stellar";
import type { SplitRule } from "../bindings-splitter/index.ts";

/* ---------- units + helpers ---------- */

const STROOPS_PER_XLM = 10_000_000n;
const toStroops = (xlm: string): bigint => {
  const n = parseFloat(xlm);
  if (!isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.round(n * 1e7));
};
const toXlm = (stroops: bigint): string => {
  const whole = stroops / STROOPS_PER_XLM;
  const frac = stroops % STROOPS_PER_XLM;
  const f = frac.toString().padStart(7, "0").replace(/0+$/, "");
  return f ? `${whole}.${f}` : whole.toString();
};
// Soroban Symbols allow [a-zA-Z0-9_], max 32 chars.
const symbolize = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32);

type Mode = "fixed" | "goal";
type FixedRow = { pocket: string; pct: string };
type GoalRow = { pocket: string; target: string };

/* ---------- local split preview (mirrors the contract) ---------- */

function computeSplit(
  mode: Mode,
  fixed: FixedRow[],
  goals: GoalRow[],
  overflow: string,
  amount: bigint,
  current: Record<string, bigint>
): Record<string, bigint> {
  const out: Record<string, bigint> = {};
  const add = (p: string, v: bigint) => { out[p] = (out[p] ?? 0n) + v; };

  if (mode === "fixed") {
    const rows = fixed.filter((r) => r.pocket && Number(r.pct) > 0);
    let distributed = 0n;
    rows.forEach((r, i) => {
      const bps = BigInt(Math.round(Number(r.pct) * 100));
      const part = i === rows.length - 1 ? amount - distributed : (amount * bps) / 10_000n;
      add(symbolize(r.pocket), part);
      distributed += part;
    });
  } else {
    let remaining = amount;
    for (const g of goals) {
      if (remaining <= 0n) break;
      const p = symbolize(g.pocket);
      if (!p) continue;
      const cur = current[p] ?? 0n;
      const need = toStroops(g.target) - cur;
      if (need <= 0n) continue;
      const put = remaining < need ? remaining : need;
      add(p, put);
      remaining -= put;
    }
    if (remaining > 0n && overflow) add(symbolize(overflow), remaining);
  }
  return out;
}

/* ---------- component ---------- */

export default function Split() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [email, setEmail] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [showFreighter, setShowFreighter] = useState(false);
  const [mode, setMode] = useState<Mode>("fixed");
  const [fixed, setFixed] = useState<FixedRow[]>([
    { pocket: "stability", pct: "50" },
    { pocket: "dca", pct: "30" },
    { pocket: "cash", pct: "20" },
  ]);
  const [goals, setGoals] = useState<GoalRow[]>([
    { pocket: "emergency", target: "100" },
    { pocket: "motor", target: "300" },
  ]);
  const [overflow, setOverflow] = useState("cash");
  const [amount, setAmount] = useState("");
  const [pockets, setPockets] = useState<[string, bigint][]>([]);
  const [busy, setBusy] = useState<"" | "rule" | "deposit" | "load">("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const deployed = Boolean(SPLITTER_ID);
  const pctTotal = fixed.reduce((s, r) => s + (Number(r.pct) || 0), 0);
  const fixedValid = mode === "fixed" ? Math.round(pctTotal) === 100 && fixed.every((r) => r.pocket) : true;
  const goalValid = mode === "goal" ? goals.every((g) => g.pocket && Number(g.target) > 0) && Boolean(overflow) : true;
  const ruleValid = mode === "fixed" ? fixedValid : goalValid;

  const currentBalances: Record<string, bigint> = Object.fromEntries(pockets);
  const preview = amount ? computeSplit(mode, fixed, goals, overflow, toStroops(amount), currentBalances) : {};

  const fail = (e: unknown) =>
    setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Something went wrong" });

  async function continueWithEmail(e: FormEvent) {
    e.preventDefault();
    setSigningIn(true); setStatus(null);
    try {
      setSession(await signInWithEmailDemo(email));
    } catch (err) { fail(err); } finally { setSigningIn(false); }
  }

  async function connectFreighter() {
    setSigningIn(true); setStatus(null);
    try {
      setSession(await connectFreighterSession());
    } catch (err) { fail(err); } finally { setSigningIn(false); }
  }

  function buildRule(): SplitRule {
    if (mode === "fixed") {
      return {
        tag: "Fixed",
        values: [
          fixed
            .filter((r) => r.pocket && Number(r.pct) > 0)
            .map((r) => ({ pocket: symbolize(r.pocket), bps: Math.round(Number(r.pct) * 100) })),
        ],
      };
    }
    return {
      tag: "Goal",
      values: [
        goals.filter((g) => g.pocket).map((g) => ({ pocket: symbolize(g.pocket), target: toStroops(g.target) })),
        symbolize(overflow),
      ],
    };
  }

  async function saveRule() {
    if (!session) return;
    setBusy("rule"); setStatus(null);
    try {
      const tx = await createSplitterClient(session).set_rule({ user: session.address, rule: buildRule() });
      await tx.signAndSend();
      setStatus({ kind: "ok", msg: "Split rule saved on-chain." });
    } catch (e) { fail(e); } finally { setBusy(""); }
  }

  async function loadPockets(addr = session?.address) {
    if (!session || !addr) return;
    setBusy("load");
    try {
      const tx = await createSplitterClient(session).pockets({ user: addr });
      const map = tx.result as Map<string, bigint>;
      setPockets([...map.entries()].filter(([, v]) => v > 0n));
    } catch (e) { fail(e); } finally { setBusy(""); }
  }

  async function deposit() {
    if (!session) return;
    const amt = toStroops(amount);
    if (amt <= 0n) return;
    setBusy("deposit"); setStatus(null);
    try {
      const tx = await createSplitterClient(session).deposit({ user: session.address, amount: amt });
      await tx.signAndSend();
      setStatus({ kind: "ok", msg: `Deposited and split ${amount} XLM.` });
      setAmount("");
      await loadPockets();
    } catch (e) { fail(e); } finally { setBusy(""); }
  }

  async function withdraw(pocket: string, xlm: string) {
    if (!session) return;
    const amt = toStroops(xlm);
    if (amt <= 0n) return;
    setBusy("load"); setStatus(null);
    try {
      const tx = await createSplitterClient(session).withdraw({ user: session.address, pocket, amount: amt });
      await tx.signAndSend();
      setStatus({ kind: "ok", msg: `Withdrew ${xlm} XLM from ${pocket}.` });
      await loadPockets();
    } catch (e) { fail(e); } finally { setBusy(""); }
  }

  const goalTargetOf = (p: string) =>
    mode === "goal" ? goals.find((g) => symbolize(g.pocket) === p) : undefined;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/dino.png" alt="Ame's dino" className="w-20" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Auto-split vault</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The moment funds land, split them into pockets — a stability slice, a DCA slice, spendable cash.
          </p>
        </div>
      </div>

      {!deployed && (
        <div className="rounded-xl border border-brand-soft/40 bg-brand-soft/10 px-4 py-3 text-center text-xs text-ink-muted">
          Preview mode — design your split now. Deploy the splitter and set{" "}
          <code className="font-mono text-ink">VITE_SPLITTER_CONTRACT_ID</code> to go on-chain.
        </div>
      )}

      {/* Sign in */}
      {session ? (
        <div className="flex items-center justify-between rounded-xl border border-edge bg-surface px-4 py-2.5">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <span className="font-mono text-xs text-ink-muted">
              {session.method === "email" ? email : `${session.address.slice(0, 6)}…${session.address.slice(-4)}`}
            </span>
          </span>
          <button type="button" onClick={() => { setSession(null); setPockets([]); }}
            className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink">
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-xl border border-edge bg-surface p-4">
          {!showFreighter ? (
            <>
              <form onSubmit={continueWithEmail} className="flex gap-2">
                <input type="email" required value={email} placeholder="you@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-edge bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand" />
                <button type="submit" disabled={signingIn}
                  className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                  {signingIn ? "…" : "Continue"}
                </button>
              </form>
              <p className="text-center text-[11px] text-ink-muted">
                No seed phrase, no extension — just an email.{" "}
                <button type="button" onClick={() => setShowFreighter(true)} className="underline underline-offset-2 hover:text-ink">
                  Use Freighter instead
                </button>
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Connect an existing wallet</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={connectFreighter} disabled={signingIn}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg hover:opacity-90 disabled:opacity-40">
                  {signingIn ? "Connecting…" : "Connect Freighter"}
                </button>
                <button type="button" onClick={() => setShowFreighter(false)} className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink">
                  Back to email
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rule builder */}
      <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Split rule</p>
          <div className="flex rounded-lg border border-edge bg-canvas p-0.5 text-xs font-medium">
            {(["fixed", "goal"] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 capitalize transition-colors ${mode === m ? "bg-brand text-brand-fg" : "text-ink-muted hover:text-ink"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {mode === "fixed" ? (
          <>
            {fixed.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={r.pocket} placeholder="pocket"
                  onChange={(e) => setFixed(fixed.map((x, j) => j === i ? { ...x, pocket: symbolize(e.target.value) } : x))}
                  className="min-w-0 flex-1 rounded-lg border border-edge bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
                <div className="flex items-center gap-1">
                  <input value={r.pct} inputMode="decimal" placeholder="0"
                    onChange={(e) => setFixed(fixed.map((x, j) => j === i ? { ...x, pct: e.target.value.replace(/[^0-9.]/g, "") } : x))}
                    className="w-16 rounded-lg border border-edge bg-canvas px-2 py-2 text-right font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
                  <span className="text-sm text-ink-muted">%</span>
                </div>
                {fixed.length > 1 && (
                  <button type="button" aria-label="Remove pocket" onClick={() => setFixed(fixed.filter((_, j) => j !== i))}
                    className="shrink-0 text-ink-muted hover:text-danger">✕</button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setFixed([...fixed, { pocket: "", pct: "" }])}
                className="text-xs font-medium text-brand hover:underline">+ Add pocket</button>
              <span className={`font-mono text-xs ${Math.round(pctTotal) === 100 ? "text-success" : "text-danger"}`}>
                {pctTotal}% / 100%
              </span>
            </div>
          </>
        ) : (
          <>
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-center font-mono text-xs text-ink-muted">{i + 1}</span>
                <input value={g.pocket} placeholder="goal name"
                  onChange={(e) => setGoals(goals.map((x, j) => j === i ? { ...x, pocket: symbolize(e.target.value) } : x))}
                  className="min-w-0 flex-1 rounded-lg border border-edge bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
                <input value={g.target} inputMode="decimal" placeholder="target"
                  onChange={(e) => setGoals(goals.map((x, j) => j === i ? { ...x, target: e.target.value.replace(/[^0-9.]/g, "") } : x))}
                  className="w-20 rounded-lg border border-edge bg-canvas px-2 py-2 text-right font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
                {goals.length > 1 && (
                  <button type="button" aria-label="Remove goal" onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                    className="shrink-0 text-ink-muted hover:text-danger">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setGoals([...goals, { pocket: "", target: "" }])}
              className="self-start text-xs font-medium text-brand hover:underline">+ Add goal</button>
            <div className="flex items-center gap-2 border-t border-edge pt-3">
              <span className="text-xs text-ink-muted">Overflow →</span>
              <input value={overflow} onChange={(e) => setOverflow(symbolize(e.target.value))}
                className="w-32 rounded-lg border border-edge bg-canvas px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
              <span className="text-xs text-ink-muted">once goals are met</span>
            </div>
          </>
        )}

        <button type="button" onClick={saveRule} disabled={!ruleValid || !deployed || !session || busy === "rule"}
          className="rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          {busy === "rule" ? "Saving…" : "Save split rule"}
        </button>
        {!ruleValid && (
          <p className="text-center text-xs text-danger">
            {mode === "fixed" ? "Percentages must total 100% and every pocket needs a name." : "Every goal needs a name + positive target, and an overflow pocket."}
          </p>
        )}
      </div>

      {/* Deposit + live preview */}
      <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Deposit &amp; split</p>
        <div className="flex gap-2">
          <input value={amount} inputMode="decimal" placeholder="0.00"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="min-w-0 flex-1 rounded-lg border border-edge bg-canvas px-3 py-2.5 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
          <span className="flex items-center text-sm text-ink-muted">XLM</span>
        </div>

        {amount && Object.keys(preview).length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg bg-canvas p-3">
            <p className="text-xs text-ink-muted">Splits into:</p>
            {Object.entries(preview).map(([p, v]) => {
              const total = toStroops(amount);
              const frac = total > 0n ? Number((v * 1000n) / total) / 10 : 0;
              return (
                <div key={p} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">{p}</span>
                    <span className="font-mono tabular-nums text-ink-muted">{toXlm(v)} XLM</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-mid">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${frac}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button type="button" onClick={deposit} disabled={!amount || !deployed || !session || busy === "deposit"}
          className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          {busy === "deposit" ? "Depositing…" : "Deposit & split"}
        </button>
      </div>

      {/* Pockets */}
      <div className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Your pockets</p>
          <button type="button" onClick={() => loadPockets()} disabled={!session || !deployed || busy === "load"}
            className="text-xs font-medium text-brand hover:underline disabled:text-ink-muted disabled:no-underline">
            {busy === "load" ? "Loading…" : "Refresh"}
          </button>
        </div>
        {pockets.length === 0 ? (
          <p className="py-2 text-center text-sm text-ink-muted">
            {deployed ? "No pockets yet — save a rule and make a deposit." : "Pockets show up here once you're on-chain."}
          </p>
        ) : (
          pockets.map(([p, v]) => <Pocket key={p} name={p} balance={v} goal={goalTargetOf(p)} onWithdraw={withdraw} />)
        )}
      </div>

      {status && (
        <p className={`text-center text-sm ${status.kind === "ok" ? "text-success" : "text-danger"}`}>{status.msg}</p>
      )}
    </div>
  );
}

/* ---------- one pocket row with inline withdraw ---------- */

function Pocket({
  name, balance, goal, onWithdraw,
}: {
  name: string;
  balance: bigint;
  goal?: GoalRow;
  onWithdraw: (pocket: string, xlm: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState("");
  const target = goal ? toStroops(goal.target) : 0n;
  const pct = target > 0n ? Math.min(100, Number((balance * 100n) / target)) : null;

  return (
    <div className="rounded-lg border border-edge bg-canvas p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink">{name}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-ink">
          {toXlm(balance)} <span className="text-xs font-normal text-ink-muted">XLM</span>
        </span>
      </div>
      {pct !== null && (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-mid">
            <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-ink-muted">{pct}% of {goal!.target} XLM goal</p>
        </div>
      )}
      <div className="mt-2">
        {open ? (
          <div className="flex gap-2">
            <input value={amt} inputMode="decimal" placeholder="Amount"
              onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
              className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-2 py-1.5 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand" />
            <button type="button" onClick={() => { onWithdraw(name, amt); setOpen(false); setAmt(""); }}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg hover:opacity-90">Withdraw</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-muted hover:text-ink">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink">
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}
