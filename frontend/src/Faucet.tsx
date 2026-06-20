import { useState } from "react";
import { connectFreighter } from "./stellar";

const FRIENDBOT = "https://friendbot.stellar.org";
const HORIZON = "https://horizon-testnet.stellar.org";

async function fetchBalance(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${HORIZON}/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const native = data.balances?.find(
      (b: { asset_type: string }) => b.asset_type === "native"
    );
    return native
      ? parseFloat(native.balance).toLocaleString("en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  } catch {
    return null;
  }
}

type Status = "idle" | "loading" | "success" | "error";

export default function Faucet() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleConnect() {
    try {
      setStatus("idle");
      setMessage("");
      const addr = await connectFreighter();
      setAddress(addr);
      setBalance(await fetchBalance(addr));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }

  async function handleAddressBlur() {
    const trimmed = address.trim();
    if (trimmed.length >= 56) {
      setBalance(await fetchBalance(trimmed));
    }
  }

  async function handleFund() {
    const trimmed = address.trim();
    if (!trimmed) return;
    setStatus("loading");
    setMessage("");
    setTxHash("");

    try {
      const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        const msg: string =
          data?.detail ??
          data?.extras?.result_codes?.operations?.[0] ??
          "Funding failed";
        throw new Error(msg);
      }

      setTxHash(data.id ?? "");
      setStatus("success");
      setMessage("10,000 XLM funded successfully.");
      setBalance(await fetchBalance(trimmed));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Funding failed");
    }
  }

  const isReady = address.trim().length >= 56;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-brand">Testnet Faucet</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Fund any Stellar testnet address with 10,000 XLM instantly
        </p>
      </div>

      {/* Address row */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="faucet-address" className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Stellar Address
        </label>
        <div className="flex gap-2">
          <input
            id="faucet-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={handleAddressBlur}
            placeholder="G…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-canvas"
          />
          <button
            type="button"
            onClick={handleConnect}
            className="shrink-0 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-mid focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-canvas focus-visible:outline-none"
          >
            Freighter
          </button>
        </div>
      </div>

      {/* Balance card */}
      {balance !== null && (
        <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Balance</span>
          <span className="font-mono text-lg font-semibold text-ink tabular-nums">
            {balance}{" "}
            <span className="text-sm font-normal text-ink-muted">XLM</span>
          </span>
        </div>
      )}

      {/* Fund button */}
      <button
        type="button"
        onClick={handleFund}
        disabled={!isReady || status === "loading"}
        className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "loading" ? "Funding…" : "Fund with 10,000 XLM"}
      </button>

      {/* Success */}
      {status === "success" && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <p className="text-sm font-medium text-success">{message}</p>
          {txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all font-mono text-xs text-success/70 underline underline-offset-2"
            >
              View on Stellar Expert →
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <p className="text-center text-sm text-danger">{message}</p>
      )}
    </div>
  );
}
