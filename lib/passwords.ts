import {
  bytesToString,
  hexToBytes,
  keccak256,
  pad,
  stringToBytes,
  toHex,
} from "viem";

export function passwordToU256(password: string): bigint {
  return BigInt(keccak256(stringToBytes(password)));
}

export function randomBytes32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export const SECRET_MAX_BYTES = 32;

/// Encode a UTF-8 secret as a 256-bit big-endian uint. Pads with trailing
/// zero bytes so `secretFromU256` can recover the original string. Throws if
/// the encoded length exceeds 32 bytes or if the secret encodes to zero
/// (which would be indistinguishable from a "wrong password" verdict).
export function secretToU256(text: string): bigint {
  const bytes = stringToBytes(text);
  if (bytes.length === 0) throw new Error("Secret is empty.");
  if (bytes.length > SECRET_MAX_BYTES) {
    throw new Error(
      `Secret is ${bytes.length} bytes; max is ${SECRET_MAX_BYTES} (UTF-8).`,
    );
  }
  const padded = pad(toHex(bytes), { size: 32, dir: "right" });
  const value = BigInt(padded);
  if (value === BigInt(0)) throw new Error("Secret encodes to zero — pick another.");
  return value;
}

/// Inverse of `secretToU256`. Strips trailing null bytes and decodes UTF-8.
/// Returns null when the value is zero (the SecretReleaseAction releases zero
/// on a false verdict).
export function secretFromU256(value: bigint): string | null {
  if (value === BigInt(0)) return null;
  const hex = pad(toHex(value), { size: 32, dir: "left" });
  const bytes = hexToBytes(hex);
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return bytesToString(bytes.slice(0, end));
}
