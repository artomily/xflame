export const STROOPS_PER_XLM = 10_000_000n;

export const toStroops = (xlm: string): bigint => {
  const n = parseFloat(xlm);
  if (!isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.round(n * 1e7));
};

export const toXlm = (stroops: bigint): string => {
  const whole = stroops / STROOPS_PER_XLM;
  const frac = stroops % STROOPS_PER_XLM;
  const f = frac.toString().padStart(7, "0").replace(/0+$/, "");
  return f ? `${whole}.${f}` : whole.toString();
};

// Soroban Symbols allow [a-zA-Z0-9_], max 32 chars.
export const symbolize = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32);

export type Mode = "fixed" | "goal";
export type FixedRow = { pocket: string; pct: string };
export type GoalRow = { pocket: string; target: string };

// Local split preview — mirrors the on-chain contract logic.
export function computeSplit(
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
