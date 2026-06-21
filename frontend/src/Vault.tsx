/**
 * Vault — deposit & withdraw XLM via Soroban contract.
 *
 * Before this works:
 *   1. Deploy contract/contracts/vault and get CONTRACT_ID
 *   2. Run: stellar contract bindings typescript \
 *        --network testnet --contract-id <ID> \
 *        --output-dir bindings-vault --overwrite
 *   3. Add to frontend/.env:
 *        VITE_VAULT_CONTRACT_ID=<ID>
 *        VITE_XLM_TOKEN_ID=<native asset contract ID>
 */
import { useState, useEffect } from "react";
import { connectFreighter } from "./stellar";
import {
  Client as VaultClient,
} from "../bindings-vault/index.ts";
import {
  signTransaction as freighterSign,
} from "@stellar/freighter-api";

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE as string;
const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL as string;
const VAULT_ID = import.meta.env.VITE_VAULT_CONTRACT_ID as string;
// XLM token contract ID — get via: stellar contract id asset --asset native --network testnet
const XLM_TOKEN_ID = import.meta.env.VITE_XLM_TOKEN_ID as string;

// 1 XLM = 10_000_000 stroops
const XLM = (stroops: bigint) => Number(stroops) / 10_000_000;
const STROOPS = (xlm: string) => BigInt(Math.round(parseFloat(xlm) * 10_000_000));

function makeClient(wallet: string) {
  return new VaultClient({
    contractId: VAULT_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: wallet,
    signTransaction: async (xdr: string) => {
      const result = await freighterSign(xdr, {
        networkPassphrase: NETWORK,
        address: wallet,
      });
      if (result.error) throw new Error(result.error.message);
      return result;
    },
  });
}

type Mode = "deposit" | "withdraw";
type Status = "idle" | "loading" | "success" | "error";

export default function Vault() {
  const [wallet, setWallet] = useState("");
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleConnect() {
    try {
      const addr = await connectFreighter();
      setWallet(addr);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to connect");
    }
  }

  async function loadBalance(addr: string) {
    try {
      const client = makeClient(addr);
      const tx = await client.balance({ user: addr });
      setVaultBalance(XLM(tx.result as bigint));
    } catch {
      setVaultBalance(null);
    }
  }

  useEffect(() => {
    if (wallet) loadBalance(wallet);
  }, [wallet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet || !amount) return;
    setStatus("loading");
    setMessage("");

    try {
      const client = makeClient(wallet);
      const stroops = STROOPS(amount);

      const tx =
        mode === "deposit"
          ? await client.deposit({ from: wallet, token: XLM_TOKEN_ID, amount: stroops })
          : await client.withdraw({ to: wallet, token: XLM_TOKEN_ID, amount: stroops });

      await tx.signAndSend();

      setStatus("success");
      setMessage(mode === "deposit" ? `Deposited ${amount} XLM into vault.` : `Withdrew ${amount} XLM from vault.`);
      setAmount("");
      await loadBalance(wallet);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Transaction failed");
    }
  }

  const notConfigured = !VAULT_ID || !XLM_TOKEN_ID;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-brand">XLM Vault</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Deposit XLM into the Soroban vault contract. Withdraw anytime.
        </p>
      </div>

      {notConfigured && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger font-medium">Contract not configured</p>
          <p className="mt-1 text-xs text-ink-muted">
            Deploy the vault contract and add <code className="font-mono text-ink">VITE_VAULT_CONTRACT_ID</code> and{" "}
            <code className="font-mono text-ink">VITE_XLM_TOKEN_ID</code> to <code className="font-mono text-ink">.env</code>.
          </p>
        </div>
      )}

      {!wallet ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={notConfigured}
          className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Connect Freighter
        </button>
      ) : (
        <>
          {/* Wallet pill */}
          <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-2">
            <span className="font-mono text-xs text-ink-muted">
              {wallet.slice(0, 8)}…{wallet.slice(-6)}
            </span>
            <button
              type="button"
              onClick={() => { setWallet(""); setVaultBalance(null); setStatus("idle"); }}
              className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Disconnect
            </button>
          </div>

          {/* Vault balance */}
          <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Vault balance
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-ink">
              {vaultBalance !== null ? vaultBalance.toFixed(7) : "—"}{" "}
              <span className="text-sm font-normal text-ink-muted">XLM</span>
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-edge bg-surface p-1 gap-1">
            {(["deposit", "withdraw"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setStatus("idle"); setMessage(""); }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  mode === m ? "bg-brand text-brand-fg" : "text-ink-muted hover:text-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="vault-amount"
                className="text-xs font-medium uppercase tracking-wider text-ink-muted"
              >
                Amount (XLM)
              </label>
              <input
                id="vault-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.0000001"
                step="any"
                required
                className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-canvas"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {status === "loading"
                ? mode === "deposit" ? "Depositing…" : "Withdrawing…"
                : mode === "deposit" ? "Deposit XLM" : "Withdraw XLM"}
            </button>
          </form>
        </>
      )}

      {status === "success" && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <p className="text-sm font-medium text-success">{message}</p>
        </div>
      )}
      {status === "error" && (
        <p className="text-center text-sm text-danger">{message}</p>
      )}
    </div>
  );
}
