"use client";

import type { Address, Hex, WalletClient } from "viem";
import { bytesToHex, getAddress } from "viem";
import { getFhevmInstance } from "./fhevm";
import { passwordToU256 } from "./passwords";

export type EncryptedInputBytes = { handle: Hex; proof: Hex };

async function encryptU256(
  value: bigint,
  contract: Address,
  caller: Address,
): Promise<EncryptedInputBytes> {
  const instance = await getFhevmInstance();
  const enc = await instance
    .createEncryptedInput(getAddress(contract), getAddress(caller))
    .add256(value)
    .encrypt();
  return {
    handle: bytesToHex(enc.handles[0]),
    proof: bytesToHex(enc.inputProof),
  };
}

export function encryptPassword(
  password: string,
  verifier: Address,
  caller: Address,
): Promise<EncryptedInputBytes> {
  return encryptU256(passwordToU256(password), verifier, caller);
}

export function encryptSecret(
  secretValue: bigint,
  contract: Address,
  caller: Address,
): Promise<EncryptedInputBytes> {
  return encryptU256(secretValue, contract, caller);
}

async function userDecrypt({
  handle,
  contractAddress,
  userAddress,
  walletClient,
}: {
  handle: Hex;
  contractAddress: Address;
  userAddress: Address;
  walletClient: WalletClient;
}): Promise<bigint | boolean | Hex> {
  const instance = await getFhevmInstance();
  const keypair = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    [contractAddress],
    startTimestamp,
    durationDays,
  );

  // The SDK returns startTimestamp/durationDays as decimal strings; viem's
  // signTypedData wants bigints for uint256 fields.
  const signature = await walletClient.signTypedData({
    account: userAddress,
    domain: eip712.domain,
    types: eip712.types,
    primaryType: eip712.primaryType,
    message: {
      ...eip712.message,
      startTimestamp: BigInt(eip712.message.startTimestamp),
      durationDays: BigInt(eip712.message.durationDays),
    },
  });

  const result = await instance.userDecrypt(
    [{ handle, contractAddress: getAddress(contractAddress) }],
    keypair.privateKey,
    keypair.publicKey,
    signature,
    [contractAddress],
    userAddress,
    startTimestamp,
    durationDays,
  );

  const lowered = handle.toLowerCase() as Hex;
  return result[lowered] ?? result[handle];
}

export async function decryptEbool(args: {
  handle: Hex;
  contractAddress: Address;
  userAddress: Address;
  walletClient: WalletClient;
}): Promise<boolean> {
  return Boolean(await userDecrypt(args));
}

export async function decryptEuint256(args: {
  handle: Hex;
  contractAddress: Address;
  userAddress: Address;
  walletClient: WalletClient;
}): Promise<bigint> {
  const value = await userDecrypt(args);
  return typeof value === "bigint" ? value : BigInt(value as Hex | number);
}
