import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: emit HTML/CSS/JS into `out/` so the site can be pinned to
  // IPFS (Fleek, Pinata) without a Node runtime. trailingSlash makes each
  // route a directory with index.html, which subdomain gateways serve cleanly.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
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
