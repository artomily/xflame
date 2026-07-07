import { useState, type FormEvent } from "react";
import { connectFreighterSession, signInWithEmailDemo, createSplitterClient, SPLITTER_ID, type WalletSession } from "./stellar";
import type { SplitRule } from "../bindings-splitter/index.ts";
import { computeSplit, symbolize, toStroops, type Mode, type FixedRow, type GoalRow } from "./lib/splitMath";

/**
 * All vault state lives here, lifted above the Dashboard/Vault tabs so
 * signing in (or loading pockets) on one tab is still there when you
 * switch to the other.
 */
export function useVault() {
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
  const [pocketFilter, setPocketFilter] = useState("");

  const deployed = Boolean(SPLITTER_ID);
  const pctTotal = fixed.reduce((s, r) => s + (Number(r.pct) || 0), 0);
  const fixedValid = mode === "fixed" ? Math.round(pctTotal) === 100 && fixed.every((r) => r.pocket) : true;
  const goalValid = mode === "goal" ? goals.every((g) => g.pocket && Number(g.target) > 0) && Boolean(overflow) : true;
  const ruleValid = mode === "fixed" ? fixedValid : goalValid;

  const currentBalances: Record<string, bigint> = Object.fromEntries(pockets);
  const preview = amount ? computeSplit(mode, fixed, goals, overflow, toStroops(amount), currentBalances) : {};

  // Dashboard-only derived stats — all computed from real vault state.
  const totalBalance = pockets.reduce((s, [, v]) => s + v, 0n);
  const configuredCount =
    mode === "fixed" ? fixed.filter((r) => r.pocket).length : goals.filter((g) => g.pocket).length;
  const goalsMet = goals.filter((g) => (currentBalances[symbolize(g.pocket)] ?? 0n) >= toStroops(g.target)).length;
  const coveragePct =
    mode === "fixed" ? Math.min(100, Math.round(pctTotal)) : goals.length ? Math.round((goalsMet / goals.length) * 100) : 0;
  const nestedItems =
    mode === "fixed"
      ? fixed
          .filter((r) => r.pocket && Number(r.pct) > 0)
          .map((r) => ({ label: r.pocket, value: Math.round(Number(r.pct)) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
      : goals
          .filter((g) => g.pocket && Number(g.target) > 0)
          .map((g) => ({ label: g.pocket, value: Math.round(Number(g.target)) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4);
  const filteredPockets = pockets.filter(([p]) => p.includes(symbolize(pocketFilter)));
  const sessionLabel = session
    ? session.method === "email"
      ? email
      : `${session.address.slice(0, 4)}•••${session.address.slice(-4)}`
    : "";

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

  function signOut() {
    setSession(null);
    setPockets([]);
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

  return {
    session, email, setEmail, signingIn, showFreighter, setShowFreighter,
    mode, setMode, fixed, setFixed, goals, setGoals, overflow, setOverflow,
    amount, setAmount, pockets, busy, status, pocketFilter, setPocketFilter,
    deployed, pctTotal, ruleValid, preview,
    totalBalance, configuredCount, coveragePct, nestedItems, filteredPockets, sessionLabel,
    continueWithEmail, connectFreighter, signOut, saveRule, loadPockets, deposit, withdraw, goalTargetOf,
  };
}

export type VaultState = ReturnType<typeof useVault>;
