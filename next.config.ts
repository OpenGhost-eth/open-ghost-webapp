import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // The Zama relayer SDK is only ever imported from a client component
  // (lib/fhevm.ts, behind a dynamic `await import(...)`), but its dep graph
  // pulls in native modules (node-tfhe, node-tkms, keccak) that the server
  // bundle's dependency tracer hangs trying to resolve. Mark the package and
  // its native peers as server-externals so they're never traced server-side.
  serverExternalPackages: [
    "@zama-fhe/relayer-sdk",
    "node-tfhe",
    "node-tkms",
    "tfhe",
    "tkms",
    "keccak",
  ],
};

export default nextConfig;
