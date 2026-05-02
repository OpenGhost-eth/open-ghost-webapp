import type { Address } from "viem";

export const SEPOLIA_CHAIN_ID = 11155111;

export const addresses = {
  ghostGate: "0x7bd5E5aBB9DdCb09d1030B122e764D34DEA0f113",
  compositeVerifier: "0xe21E1FBF73c3A329B7dbE4dB33BAeEF829718781",
  compositeAction: "0x6D9824Dd1a4CB3dF34E3a69c17D7Fa68dac5E674",
  fheEqVerifier: "0xc92A9d5A176a695aa6Eb8Bd815E34aE459e5e2b7",
  eqRegistrationHelper: "0xF2BC25f7dd84aE1ECbae04a240468a13f62aCAEC",
  secretReleaseAction: "0xCb53fA3B79ac5C84E5DbE3f7420E86bb111AcBF0",
} as const satisfies Record<string, Address>;

export const eqRegistrationHelperAbi = [
  {
    type: "function",
    name: "registerWithCommit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "encExpected", type: "bytes32" },
      { name: "expectedProof", type: "bytes" },
      { name: "cooldown_", type: "uint256" },
      { name: "attemptFee_", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const fheEqVerifierAbi = [
  {
    type: "function",
    name: "decommit",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "ok", type: "bool" }],
  },
  {
    type: "function",
    name: "committer",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export const ghostGateAbi = [
  {
    type: "function",
    name: "check",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "verifierData", type: "bytes" },
      { name: "caller", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "ownerAddr", type: "address" }],
  },
  {
    type: "function",
    name: "cooldown",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "cooldownSec", type: "uint256" }],
  },
  {
    type: "function",
    name: "feeOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "feeWei", type: "uint256" }],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "ok", type: "bool" }],
  },
  {
    type: "function",
    name: "deleteEntry",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "event",
    name: "CheckAttempted",
    inputs: [
      { indexed: true, name: "caller", type: "address" },
      { indexed: true, name: "id", type: "bytes32" },
      { indexed: false, name: "verdict", type: "bytes32" },
    ],
  },
] as const;

export const secretReleaseActionAbi = [
  {
    type: "function",
    name: "store",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "encSecret", type: "bytes32" },
      { name: "secretProof", type: "bytes" },
      { name: "dispatcher", type: "address" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [{ name: "ok", type: "bool" }],
  },
  {
    type: "function",
    name: "deleteVault",
    stateMutability: "nonpayable",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [{ name: "ownerAddr", type: "address" }],
  },
  {
    type: "event",
    name: "Released",
    inputs: [
      { indexed: true, name: "vaultId", type: "bytes32" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "released", type: "bytes32" },
    ],
  },
] as const;

export const compositeActionAbi = [
  {
    type: "function",
    name: "configure",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "entryId", type: "bytes32" },
      {
        name: "actions",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "fire",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "verifierData", type: "bytes" },
      { name: "caller", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "ok", type: "bool" }],
  },
  {
    type: "function",
    name: "deconfigure",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "ownerAddr", type: "address" }],
  },
  {
    type: "event",
    name: "ActionFailed",
    inputs: [
      { indexed: true, name: "id", type: "bytes32" },
      { indexed: true, name: "index", type: "uint256" },
      { indexed: false, name: "target", type: "address" },
    ],
  },
] as const;
