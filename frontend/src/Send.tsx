import { useState, type FormEvent } from "react";
import {
  Asset,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { connectFreighter } from "./stellar";
import Ame from "./Ame";

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

type Status = "idle" | "loading" | "success" | "error";

export default function Send() {
  const [wallet, setWallet] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleConnect() {
    try {
      setStatus("idle");
      setMessage("");
      setWallet(await connectFreighter());
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setTxHash("");

    try {
      const sourceAccount = await horizon.loadAccount(wallet);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: to.trim(),
            asset: Asset.native(),
            amount: amount,
          })
        )
        .setTimeout(30)
        .build();

      const result = await signTransaction(tx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
        address: wallet,
      });

      if (result.error) throw new Error(result.error.message);

      const signed = TransactionBuilder.fromXDR(
        result.signedTxXdr,
        Networks.TESTNET
      );
      const response = await horizon.submitTransaction(signed);

      setTxHash(response.hash);
      setStatus("success");
      setMessage(`Sent ${amount} XLM.`);
      setTo("");
      setAmount("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Transaction failed");
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-brand">Send XLM</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Transfer XLM to any Stellar address on testnet
        </p>
      </div>

      {!wallet ? (
        <button
          type="button"
          onClick={handleConnect}
          className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Connect Freighter
        </button>
      ) : (
        <>
          {/* Connected wallet pill */}
          <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-2">
            <span className="font-mono text-xs text-ink-muted">
              {wallet.slice(0, 8)}…{wallet.slice(-6)}
            </span>
            <button
              type="button"
              onClick={() => { setWallet(""); setStatus("idle"); setMessage(""); }}
              className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Disconnect
            </button>
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="send-to"
                className="text-xs font-medium uppercase tracking-wider text-ink-muted"
              >
                Recipient address
              </label>
              <input
                id="send-to"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="G…"
                autoComplete="off"
                spellCheck={false}
                required
                minLength={56}
                maxLength={56}
                className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-canvas"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="send-amount"
                className="text-xs font-medium uppercase tracking-wider text-ink-muted"
              >
                Amount (XLM)
              </label>
              <input
                id="send-amount"
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
              className="flex items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? (
                <>
                  <Ame size={20} mood="loading" title="" />
                  Sending…
                </>
              ) : (
                "Send XLM"
              )}
            </button>
          </form>
        </>
      )}

      {status === "success" && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <Ame size={40} mood="happy" title="Ame is happy" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-success">{message}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all font-mono text-xs text-success/70 underline underline-offset-2"
            >
              View on Stellar Expert →
            </a>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-center text-sm text-danger">{message}</p>
      )}
    </div>
  );
}
