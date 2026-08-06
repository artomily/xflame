/**
 * Chart primitives for the dashboard. Plain SVG, no chart library — every
 * colour comes from a brand token so light/dark tuning stays in index.css.
 */

import { useState } from "react";
import type { Point } from "./demoData";

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/** Point on a circle, 0° = 12 o'clock, sweeping clockwise. */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Catmull-Rom through every point, emitted as cubic beziers. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}`;
    d += ` ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}`;
    d += ` ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ---------- weekly deposit bars ---------- */

const W = 700;
const H = 240;
const TOP_PAD = 34;

/**
 * Rounded track bars scaled to each day's deposits, with a smoothed curve over
 * the tops and a tooltip on the hovered column.
 */
export function SplitBarChart({
  series,
  empty = false,
  unit = "XLM",
  emptyLabel = "No deposits yet this week",
}: {
  series: Point[];
  empty?: boolean;
  unit?: string;
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const n = Math.max(series.length, 1);
  const slot = W / n;
  const barW = Math.min(slot * 0.62, 74);
  const max = Math.max(...series.map((p) => p.value), 1);

  // Every day keeps a visible track bar so a sparse week still reads as a chart.
  const MIN_BAR = H * 0.22;
  const heightOf = (v: number) => (empty ? MIN_BAR : Math.max(MIN_BAR, (v / max) * (H - TOP_PAD)));
  const tops: [number, number][] = series.map((p, i) => [
    slot * i + slot / 2,
    H - heightOf(p.value),
  ]);

  const hovered = active !== null ? series[active] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Deposits per day, in ${unit}`}>
        <defs>
          <linearGradient id="bar-active" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {series.map((p, i) => {
          const h = heightOf(p.value);
          return (
            <rect
              key={p.day}
              x={slot * i + (slot - barW) / 2}
              y={H - h}
              width={barW}
              height={h}
              rx={14}
              fill={i === active ? "url(#bar-active)" : "var(--color-surface-mid)"}
            />
          );
        })}

        {!empty && (
          <path
            d={smoothPath(tops)}
            fill="none"
            stroke="var(--color-brand-soft)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {!empty && active !== null && (
          <circle cx={tops[active][0]} cy={tops[active][1]} r={7} fill="var(--color-brand)" />
        )}

        {/* Invisible hit targets — one per column. */}
        {series.map((p, i) => (
          <rect
            key={`hit-${p.day}`}
            x={slot * i}
            y={0}
            width={slot}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          />
        ))}
      </svg>

      {hovered && !empty && (
        <div
          className="chart-tooltip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-brand-fg shadow-lg"
          style={{
            left: `${((active! + 0.5) / n) * 100}%`,
            top: `${(tops[active!][1] / H) * 100 - 6}%`,
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-brand-fg/60">{hovered.day}</p>
          <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" aria-hidden="true" />
            Total
            <span className="font-mono font-semibold tabular-nums">
              {hovered.value.toLocaleString("en", { maximumFractionDigits: 2 })} {unit}
            </span>
          </p>
        </div>
      )}

      <div className="mt-1 flex">
        {series.map((p, i) => (
          <span
            key={p.day}
            className={`flex-1 text-center text-xs transition-colors ${
              i === active ? "font-medium text-ink" : "text-ink-muted"
            }`}
          >
            {p.day}
          </span>
        ))}
      </div>

      {empty && <p className="mt-3 text-center text-xs text-ink-muted">{emptyLabel}</p>}
    </div>
  );
}

/* ---------- segmented semicircular gauge ---------- */

const TICKS = 21;

/**
 * Semicircle of rounded ticks, filled left-to-right to `pct`. The filled run
 * ramps in opacity so the arc reads as a gradient without a second colour.
 */
export function CoverageGauge({
  pct,
  total,
  totalLabel,
  markLabel,
  markValue,
}: {
  pct: number;
  total: string;
  totalLabel: string;
  markLabel?: string;
  markValue?: string;
}) {
  const cx = 120;
  const cy = 132;
  const r = 86;
  const filled = Math.round((clampPct(pct) / 100) * TICKS);

  return (
    <div className="relative w-full max-w-[260px]">
      <svg viewBox="0 0 240 150" className="w-full" role="img" aria-label={`${Math.round(pct)}% ${totalLabel}`}>
        {Array.from({ length: TICKS }, (_, i) => {
          const on = i < filled;
          const angle = -90 + (180 * i) / (TICKS - 1);
          return (
            <rect
              key={i}
              x={cx - 4.5}
              y={cy - r - 11}
              width={9}
              height={22}
              rx={4.5}
              transform={`rotate(${angle} ${cx} ${cy})`}
              fill={on ? "var(--color-brand)" : "var(--color-surface-mid)"}
              opacity={on ? 0.35 + 0.65 * (i / Math.max(filled - 1, 1)) : 1}
            />
          );
        })}
      </svg>

      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-ink">{total}</span>
        <span className="text-xs text-ink-muted">{totalLabel}</span>
      </div>

      {markLabel && (
        <div className="absolute right-0 top-8 flex items-center gap-1.5 text-right">
          <span className="h-px w-3 bg-edge" aria-hidden="true" />
          <span>
            <span className="block font-mono text-sm font-semibold tabular-nums text-ink">{markValue}</span>
            <span className="block text-[11px] text-ink-muted">{markLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- open-arc progress dial ---------- */

const SWEEP_FROM = -130;
const SWEEP_TO = 130;

/** 260° arc with a knob at the head — used on the goal-pocket promo card. */
export function MiniGauge({ pct, caption }: { pct: number; caption: string }) {
  const p = clampPct(pct);
  const cx = 80;
  const cy = 80;
  const r = 58;
  const head = SWEEP_FROM + ((SWEEP_TO - SWEEP_FROM) * p) / 100;
  const [kx, ky] = polar(cx, cy, r, head);

  return (
    <div className="relative w-full max-w-[176px]">
      <svg viewBox="0 0 160 130" className="w-full" role="img" aria-label={`${Math.round(p)}% ${caption}`}>
        <path
          d={arcPath(cx, cy, r, SWEEP_FROM, SWEEP_TO)}
          fill="none"
          stroke="var(--color-surface-mid)"
          strokeWidth={11}
          strokeLinecap="round"
        />
        {p > 0 && (
          <path
            d={arcPath(cx, cy, r, SWEEP_FROM, head)}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={11}
            strokeLinecap="round"
          />
        )}
        <circle cx={kx} cy={ky} r={7} fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth={3} />
      </svg>

      <div className="absolute inset-x-0 top-[42%] flex flex-col items-center">
        <span className="font-mono text-2xl font-bold tabular-nums text-ink">{Math.round(p)}%</span>
        <span className="px-4 text-center text-[11px] leading-tight text-ink-muted">{caption}</span>
      </div>
    </div>
  );
}
