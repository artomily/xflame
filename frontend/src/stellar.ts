import { isConnected, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { Client as SplitterClient } from "../bindings-splitter/index.ts";

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

/** Shared client options: network config + Freighter signer bound to one wallet. */
function clientOptions(walletAddress: string, contractId: string): ClientOptions {
  const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = import.meta.env.VITE_STELLAR_RPC_URL;

  return {
    contractId,
    networkPassphrase,
    rpcUrl,
    publicKey: walletAddress,
    signTransaction: async (xdr: string, opts?: Parameters<NonNullable<ClientOptions["signTransaction"]>>[1]) => {
      const result = await freighterSignTransaction(xdr, {
        networkPassphrase,
        address: walletAddress,
        ...opts,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
  };
}

/** Contract ID for the auto-split vault (Phase 1). Empty until the splitter is deployed. */
export const SPLITTER_ID = import.meta.env.VITE_SPLITTER_CONTRACT_ID as string | undefined;

export function createSplitterClient(walletAddress: string) {
  if (!SPLITTER_ID) {
    throw new Error("Splitter not deployed yet — set VITE_SPLITTER_CONTRACT_ID in .env");
  }
  return new SplitterClient(clientOptions(walletAddress, SPLITTER_ID));
}
