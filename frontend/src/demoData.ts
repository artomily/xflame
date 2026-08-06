/**
 * Shapes for the dashboard's data, plus the signed-out placeholder state.
 *
 * There is deliberately no sample dataset here: before a session exists the
 * dashboard renders `EMPTY` (all zeroes), never invented balances. A visitor
 * should not be shown a figure that never happened on-chain.
 *
 * Photography is hot-linked from Unsplash as a placeholder.
 */

const photo = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`;

/** Goal-pocket promo card artwork. */
export const GOAL_PHOTO = photo("photo-1554224155-6726b3ff858f", 900, 700);

export type Point = { day: string; value: number };

export type PocketStatus = "funded" | "filling" | "new";

export type PocketRow = {
  name: string;
  rule: string;
  balance: string;
  /** Share of the vault's total balance this pocket holds, 0-100. */
  sharePct: number;
  lastSplit: string;
  status: PocketStatus;
};

export type DashboardData = {
  /** Formatted XLM total across every pocket. */
  totalXlm: string;
  /** Week-over-week change, or null when there is no history to compare. */
  deltaPct: number | null;
  statusLabel: string;
  series: Point[];
  /** True when there is no deposit history to plot. */
  seriesEmpty: boolean;
  pocketCount: number;
  coveragePct: number;
  fundedCount: number;
  statA: { label: string; value: string };
  statB: { label: string; value: string };
  insightCount: number;
  insightBody: string;
  insightNote: string;
  updatedLabel: string;
  rows: PocketRow[];
};

/**
 * Signed-out state. The dashboard keeps its full layout so the product still
 * reads as finished, but every figure is zeroed — nothing here asserts a
 * balance or a split that never happened on-chain.
 */
export const EMPTY: DashboardData = {
  totalXlm: "0.00",
  deltaPct: null,
  statusLabel: "Not signed in",
  series: [],
  seriesEmpty: true,
  pocketCount: 0,
  coveragePct: 0,
  fundedCount: 0,
  statA: { label: "Routed per deposit", value: "—" },
  statB: { label: "Unallocated", value: "—" },
  insightCount: 0,
  insightBody:
    "Ame reads your rule and every confirmed deposit, then reports how the funds divided — which pocket filled, which is still short, and where the next deposit lands.",
  insightNote: "Sign in to see your split",
  updatedLabel: "Sign in to see live figures",
  rows: [],
};

export const EMPTY_GOAL = {
  name: "No vault yet",
  pct: 0,
  caption: "Sign in to get started",
  sub: "Nothing to show",
};
