import { isConnected, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { Client as SplitterClient } from "../bindings-splitter/index.ts";

const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE;
const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL;
const FRIENDBOT = "https://friendbot.stellar.org";
const HORIZON = "https://horizon-testnet.stellar.org";

/**
 * Native XLM balance in stroops, or 0n for an account Horizon has never seen
 * (a Freighter wallet that was created but never funded). Used to warn before
 * a deposit rather than letting it fail with a raw RPC error.
 */
export async function fetchXlmBalance(address: string): Promise<bigint> {
  const res = await fetch(`${HORIZON}/accounts/${encodeURIComponent(address)}`);
  if (res.status === 404) return 0n;
  if (!res.ok) throw new Error("Couldn't read your balance from Horizon.");

  const json = (await res.json()) as { balances?: { asset_type: string; balance: string }[] };
  const native = json.balances?.find((b) => b.asset_type === "native");
  if (!native) return 0n;

  // Parse the decimal string exactly — Horizon always returns 7 dp, and going
  // via Number would lose precision on large testnet balances.
  const [whole, frac = ""] = native.balance.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, "0").slice(0, 7));
}

export type WalletSession = {
  address: string;
  /** How the user got this session — only used for display copy. */
  method: "freighter" | "email";
  signTransaction: NonNullable<ClientOptions["signTransaction"]>;
};

export async function connectFreighter() {
  const check = await isConnected();
  if (!check.isConnected) {
    throw new Error("Freighter is not installed. Install it at https://www.freighter.app");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message);
  }

  return access.address;
}

export async function connectFreighterSession(): Promise<WalletSession> {
  const address = await connectFreighter();
  return {
    address,
    method: "freighter",
    signTransaction: async (xdr, opts) => {
      const result = await freighterSignTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address,
        ...opts,
      });
      if (result.error) throw new Error(result.error.message);
      return result;
    },
  };
}

/**
 * DEMO-ONLY email sign-in. Stands in for a production passkey-based smart
 * wallet (no seed phrase, no browser extension) — see roadmap. A testnet
 * keypair is generated locally per email and cached in localStorage so the
 * "account" persists across visits.
 *
 * This is NOT a secure wallet: the secret key sits in plaintext in
 * localStorage. Fine for a hackathon testnet demo where nothing of value is
 * at stake; never do this for mainnet funds.
 */
export async function signInWithEmailDemo(email: string): Promise<WalletSession> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Enter an email to continue");

  const storageKey = `xflame-demo-key:${normalized}`;
  let secret = localStorage.getItem(storageKey);
  const isNew = !secret;
  if (!secret) {
    secret = Keypair.random().secret();
    localStorage.setItem(storageKey, secret);
  }

  const keypair = Keypair.fromSecret(secret);
  if (isNew) {
    const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(keypair.publicKey())}`);
    if (!res.ok) throw new Error("Couldn't fund the demo account — try again in a moment.");
  }

  return {
    address: keypair.publicKey(),
    method: "email",
    signTransaction: async (xdr, opts) => {
      const tx = TransactionBuilder.fromXDR(xdr, opts?.networkPassphrase ?? NETWORK_PASSPHRASE);
      tx.sign(keypair);
      return { signedTxXdr: tx.toXDR() };
    },
  };
}

/** Contract ID for the auto-split vault (Phase 1). Empty until the splitter is deployed. */
export const SPLITTER_ID = import.meta.env.VITE_SPLITTER_CONTRACT_ID as string | undefined;

export function createSplitterClient(session: WalletSession) {
  if (!SPLITTER_ID) {
    throw new Error("Splitter not deployed yet — set VITE_SPLITTER_CONTRACT_ID in .env");
  }
  return new SplitterClient({
    contractId: SPLITTER_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: session.address,
    signTransaction: session.signTransaction,
  });
}
