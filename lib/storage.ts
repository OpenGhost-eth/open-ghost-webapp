import type { Address, Hex } from "viem";

export type StoredEntry = {
  id: Hex;
  owner: Address;
  cooldownSec: number;
  attemptFeeWei: string;
  registeredAt: number;
  label?: string;
  /// True for entries that also have a SecretReleaseAction vault and a
  /// CompositeAction recipe configured. False/absent = phase-1 verdict-only.
  hasSecret?: boolean;
};

const KEY_PREFIX = "open-ghost.entries.";

function keyFor(owner: Address): string {
  return `${KEY_PREFIX}${owner.toLowerCase()}`;
}

export function loadEntries(owner: Address): StoredEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(keyFor(owner));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(owner: Address, entries: StoredEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(owner), JSON.stringify(entries));
}

export function addEntry(owner: Address, entry: StoredEntry): StoredEntry[] {
  const existing = loadEntries(owner).filter((e) => e.id !== entry.id);
  const next = [entry, ...existing];
  saveEntries(owner, next);
  return next;
}

export function removeEntry(owner: Address, id: Hex): StoredEntry[] {
  const next = loadEntries(owner).filter((e) => e.id !== id);
  saveEntries(owner, next);
  return next;
}
