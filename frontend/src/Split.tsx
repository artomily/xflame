import { useState } from "react";
import type { VaultState } from "./useVault";
import { toStroops, toXlm, type GoalRow, type Mode } from "./lib/splitMath";

export default function Split({ vault }: { vault: VaultState }) {
  const {
    session, email, setEmail, signingIn, showFreighter, setShowFreighter,
    mode, setMode, fixed, setFixed, goals, setGoals, overflow, setOverflow,
    amount, setAmount, pockets, busy, status, deployed, pctTotal, ruleValid, preview,
    sessionLabel, continueWithEmail, connectFreighter, signOut, saveRule, loadPockets,
    deposit, withdraw, goalTargetOf,
  } = vault;

  return (
    <div className="flex w-full max-w-md flex-col gap-4 lg:max-w-5xl lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6">
      {!deployed && (
        <div className="rounded-xl border border-brand-soft/40 bg-brand-soft/10 px-4 py-3 text-center text-xs text-ink-muted lg:col-span-2">
          Preview mode — design your split now. Deploy the splitter and set{" "}
          <code className="font-mono text-ink">VITE_SPLITTER_CONTRACT_ID</code> to go on-chain.
        </div>
      )}

      {/* Left column: heading, sign-in, rule builder */}
      <div className="flex flex-col gap-4 lg:col-start-1">

      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/dino.png" alt="Ame's dino" className="ame-float w-20" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Auto-split vault</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The moment funds land, split them into pockets — a stability slice, a DCA slice, spendable cash.
          </p>
        </div>
      </div>

      {/* Sign in */}
      {session ? (
        <div className="flex items-center justify-between rounded-xl border border-edge bg-surface px-4 py-2.5">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <span className="font-mono text-xs text-ink-muted">{sessionLabel}</span>
          </span>
          <button type="button" onClick={signOut}
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
      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4">
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
                  onChange={(e) => setFixed(fixed.map((x, j) => j === i ? { ...x, pocket: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32) } : x))}
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
                  onChange={(e) => setGoals(goals.map((x, j) => j === i ? { ...x, pocket: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32) } : x))}
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
              <input value={overflow} onChange={(e) => setOverflow(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32))}
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
      </div>

      {/* Right column: deposit + live preview, pockets */}
      <div className="flex flex-col gap-4 lg:col-start-2">

      {/* Deposit + live preview */}
      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4">
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
      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface p-4">
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
      </div>

      {status && (
        <p className={`text-center text-sm ${status.kind === "ok" ? "text-success" : "text-danger"} lg:col-span-2`}>{status.msg}</p>
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
