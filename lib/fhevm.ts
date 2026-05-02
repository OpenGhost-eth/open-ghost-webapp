"use client";

import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

const DEFAULT_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

let instancePromise: Promise<FhevmInstance> | null = null;

export async function getFhevmInstance(): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("getFhevmInstance must be called from the browser");
  }
  if (!instancePromise) {
    instancePromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import(
        "@zama-fhe/relayer-sdk/web"
      );
      await initSDK();
      const rpcUrl =
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? DEFAULT_SEPOLIA_RPC;
      return createInstance({ ...SepoliaConfig, network: rpcUrl });
    })();
  }
  return instancePromise;
}
