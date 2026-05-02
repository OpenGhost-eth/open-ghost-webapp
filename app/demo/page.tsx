"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  decodeEventLog,
  encodeAbiParameters,
  formatEther,
  getAddress,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  addresses,
  compositeActionAbi,
  eqRegistrationHelperAbi,
  fheEqVerifierAbi,
  ghostGateAbi,
  secretReleaseActionAbi,
  SEPOLIA_CHAIN_ID,
} from "@/lib/contracts";
import {
  decryptEbool,
  decryptEuint256,
  encryptPassword,
  encryptSecret,
} from "@/lib/fhe-flow";
import {
  randomBytes32,
  SECRET_MAX_BYTES,
  secretFromU256,
  secretToU256,
} from "@/lib/passwords";
import {
  addEntry as cacheAddEntry,
  loadEntries,
  removeEntry as cacheRemoveEntry,
  type StoredEntry,
} from "@/lib/storage";

type AttemptState = {
  status: "idle" | "encrypting" | "submitting" | "decrypting" | "done" | "error";
  message?: string;
  verdict?: boolean;
  verdictHandle?: Hex;
  releasedHandle?: Hex;
  releasedSecret?: string | null;
  txHash?: Hex;
};

const DEFAULT_COOLDOWN = 30;
const DEFAULT_FEE_ETH = "0";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link
          className="font-mono text-sm tracking-tight text-white"
          href="/"
        >
          open-ghost
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
          <Link className="text-white" href="/demo">
            Demo
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-8 pb-12">
        <p className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
          Demo · Password-gated secret release
        </p>
        <h1 className="mb-4 text-3xl leading-tight font-medium tracking-tight text-white sm:text-4xl">
          Store an encrypted secret. Release it on a correct password.
        </h1>
        <p className="max-w-3xl leading-relaxed text-neutral-400">
          Registration encrypts the password, encrypts the secret, and wires up
          a recipe in the shared{" "}
          <code className="font-mono text-sm text-neutral-100">CompositeAction</code>
          . On a correct guess, the secret is released as a ciphertext only
          your wallet can decrypt — every other observer just sees encrypted
          noise. Built on the live Sepolia stack — gate{" "}
          <Mono>{addresses.ghostGate}</Mono>.
        </p>
      </section>

      <WalletGate>
        <Workspace />
      </WalletGate>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-xs text-neutral-500">
          <div>open-ghost · MIT</div>
          <div className="flex gap-6">
            <Link className="transition hover:text-neutral-300" href="/">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending: connectPending } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switchPending } = useSwitchChain();

  const onWrongChain = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  return (
    <section className="border-t border-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-xs tracking-widest text-neutral-500 uppercase">
            Wallet
          </div>
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <>
                <span className="font-mono text-xs text-neutral-400">
                  {short(address)}
                </span>
                {onWrongChain ? (
                  <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    disabled={switchPending}
                    className="border border-amber-700 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:border-amber-500 disabled:opacity-50"
                  >
                    {switchPending ? "Switching…" : "Switch to Sepolia"}
                  </button>
                ) : (
                  <span className="font-mono text-xs text-neutral-500">
                    Sepolia
                  </span>
                )}
                <button
                  onClick={() => disconnect()}
                  className="border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <ConnectButton
                connectors={connectors}
                pending={connectPending}
                onConnect={(connector) =>
                  connect(
                    { connector },
                    {
                      onError: (e) => console.error("[demo] connect error", e),
                    },
                  )
                }
              />
            )}
          </div>
        </div>
        {!isConnected ? (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Connect an injected wallet (MetaMask, Rabby, …) on Sepolia. You&apos;ll
            need a small amount of testnet ETH for the registration tx and per
            attempt.
          </p>
        ) : null}
      </div>

      {isConnected && !onWrongChain ? (
        <div className="border-t border-neutral-900">{children}</div>
      ) : null}
    </section>
  );
}

function ConnectButton({
  connectors,
  pending,
  onConnect,
}: {
  connectors: readonly import("wagmi").Connector[];
  pending: boolean;
  onConnect: (connector: import("wagmi").Connector) => void;
}) {
  // EIP-6963-announced wallets carry a reverse-DNS id (e.g. "io.metamask")
  // and a real name. The fallback `injected()` connector has id "injected".
  // Prefer the announced ones — the basic `injected()` only works when the
  // wallet still injects window.ethereum directly, which many no longer do.
  const real = connectors.filter((c) => c.id !== "injected");
  const list = real.length > 0 ? real : connectors;

  if (list.length === 0) {
    return (
      <span className="text-xs text-neutral-500">
        No wallet detected. Install MetaMask, Rabby, etc.
      </span>
    );
  }

  if (list.length === 1) {
    const c = list[0];
    return (
      <button
        onClick={() => onConnect(c)}
        disabled={pending}
        className="bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Connecting…" : `Connect ${c.name}`}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {list.map((c) => (
        <button
          key={c.uid}
          onClick={() => onConnect(c)}
          disabled={pending}
          className="bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function Workspace() {
  const { address } = useAccount();
  const [entries, setEntries] = useState<StoredEntry[]>([]);

  useEffect(() => {
    // localStorage is only available in the browser; reload whenever the
    // active EOA changes. This is a sync-with-external-system effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (address) setEntries(loadEntries(address));
  }, [address]);

  if (!address) return null;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-2">
      <RegisterPanel
        owner={address}
        onRegistered={(entry) => setEntries(cacheAddEntry(address, entry))}
      />
      <EntriesPanel
        owner={address}
        entries={entries}
        onForget={(id) => setEntries(cacheRemoveEntry(address, id))}
      />
    </div>
  );
}

function RegisterPanel({
  owner,
  onRegistered,
}: {
  owner: Address;
  onRegistered: (entry: StoredEntry) => void;
}) {
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [cooldownInput, setCooldownInput] = useState(String(DEFAULT_COOLDOWN));
  const [feeInput, setFeeInput] = useState(DEFAULT_FEE_ETH);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicClient) return;
    setBusy(true);
    setError(null);
    setStatus("Validating…");
    try {
      const cooldownSec = Number(cooldownInput);
      if (!Number.isFinite(cooldownSec) || cooldownSec < 30 || cooldownSec > 365 * 24 * 3600) {
        throw new Error("Cooldown must be between 30 and 31,536,000 seconds.");
      }
      const attemptFeeWei = parseEther(feeInput || "0");
      if (!password) throw new Error("Password is required.");
      const secretValue = secretToU256(secret);

      // Same id is reused as the gate entryId, vault id, and recipe id —
      // each contract has its own keyspace so collisions across them are
      // impossible. Keeps state simple: one bytes32 per entry.
      const id = randomBytes32();

      // -- Tx 1: register the password gate -----------------------------------
      // The helper calls verifier.commitFor(...) inside its own frame, so the
      // input proof binds to (verifier, helper) — not (verifier, EOA).
      setStatus("Encrypting password…");
      const encPwd = await encryptPassword(
        password,
        addresses.fheEqVerifier,
        addresses.eqRegistrationHelper,
      );
      setStatus("Tx 1/3 — register password gate. Confirm in wallet…");
      const tx1 = await writeContractAsync({
        chainId: SEPOLIA_CHAIN_ID,
        address: addresses.eqRegistrationHelper,
        abi: eqRegistrationHelperAbi,
        functionName: "registerWithCommit",
        args: [id, encPwd.handle, encPwd.proof, BigInt(cooldownSec), attemptFeeWei],
      });
      const r1 = await publicClient.waitForTransactionReceipt({ hash: tx1 });
      if (r1.status !== "success") throw new Error("registerWithCommit reverted.");

      // -- Tx 2: store the encrypted secret in the vault ---------------------
      // store() is called by the EOA, so the input proof binds to
      // (secretReleaseAction, EOA).
      setStatus("Encrypting secret…");
      const encSec = await encryptSecret(
        secretValue,
        addresses.secretReleaseAction,
        owner,
      );
      setStatus("Tx 2/3 — store encrypted secret. Confirm in wallet…");
      const tx2 = await writeContractAsync({
        chainId: SEPOLIA_CHAIN_ID,
        address: addresses.secretReleaseAction,
        abi: secretReleaseActionAbi,
        functionName: "store",
        args: [
          id,
          encSec.handle,
          encSec.proof,
          addresses.compositeAction,
          // recipient = address(0) defers to the dispatch caller — i.e. the
          // EOA who calls compositeAction.fire later.
          "0x0000000000000000000000000000000000000000",
        ],
      });
      const r2 = await publicClient.waitForTransactionReceipt({ hash: tx2 });
      if (r2.status !== "success") throw new Error("store() reverted.");

      // -- Tx 3: configure the composite recipe ------------------------------
      setStatus("Tx 3/3 — configure composite recipe. Confirm in wallet…");
      const actionData = encodeAbiParameters([{ type: "bytes32" }], [id]);
      const tx3 = await writeContractAsync({
        chainId: SEPOLIA_CHAIN_ID,
        address: addresses.compositeAction,
        abi: compositeActionAbi,
        functionName: "configure",
        args: [
          id,
          id,
          [{ target: addresses.secretReleaseAction, data: actionData }],
        ],
      });
      const r3 = await publicClient.waitForTransactionReceipt({ hash: tx3 });
      if (r3.status !== "success") throw new Error("configure() reverted.");

      onRegistered({
        id,
        owner,
        cooldownSec,
        attemptFeeWei: attemptFeeWei.toString(),
        registeredAt: Math.floor(Date.now() / 1000),
        label: label || undefined,
        hasSecret: true,
      });
      setStatus(`Registered. Last tx ${short(tx3)}.`);
      setPassword("");
      setSecret("");
      setLabel("");
    } catch (e) {
      setError(toErrorMessage(e));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
        Create entry
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Label (local only)">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="staging-vault"
            className={inputCls}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
        <Field label={`Secret (UTF-8, ≤${SECRET_MAX_BYTES} bytes)`}>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
            placeholder="api-key-1234"
            className={inputCls}
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cooldown (seconds)">
            <input
              type="number"
              min={30}
              max={365 * 24 * 3600}
              value={cooldownInput}
              onChange={(e) => setCooldownInput(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Attempt fee (ETH)">
            <input
              type="text"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {busy ? "Working…" : "Register entry"}
        </button>
        {status ? <Note>{status}</Note> : null}
        {error ? <ErrorBox>{error}</ErrorBox> : null}
      </form>
      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Three transactions: register the password gate, store the encrypted
        secret in <Mono>{addresses.secretReleaseAction}</Mono>, and configure a
        recipe in the shared <Mono>{addresses.compositeAction}</Mono> linking
        the two. Both password and secret are encrypted client-side; neither
        ever leaves your machine in plaintext.
      </p>
    </div>
  );
}

function EntriesPanel({
  owner,
  entries,
  onForget,
}: {
  owner: Address;
  entries: StoredEntry[];
  onForget: (id: Hex) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
        Your entries
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No entries cached for{" "}
          <span className="font-mono">{short(owner)}</span> yet. Register one on
          the left.
        </p>
      ) : (
        <ul className="space-y-6">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onForget={() => onForget(entry.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  onForget,
}: {
  entry: StoredEntry;
  onForget: () => void;
}) {
  const [guess, setGuess] = useState("");
  const [attempt, setAttempt] = useState<AttemptState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<{
    busy: boolean;
    status?: string;
    error?: string;
  }>({ busy: false });

  const publicClient = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const { data: walletClient } = useWalletClient({ chainId: SEPOLIA_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();

  const feeWei = useMemo(() => BigInt(entry.attemptFeeWei), [entry.attemptFeeWei]);

  async function onDelete() {
    if (!publicClient) return;
    const txCount = entry.hasSecret ? 4 : 2;
    const ok = window.confirm(
      `Permanently delete this entry on-chain? This needs ${txCount} sequential transactions and cannot be undone. The id ${entry.id.slice(0, 10)}… will be free for re-registration immediately after.`,
    );
    if (!ok) return;

    setDeleteState({ busy: true });
    const wait = async (label: string, hash: Hex) => {
      const r = await publicClient.waitForTransactionReceipt({ hash });
      if (r.status !== "success") throw new Error(`${label} reverted.`);
    };

    try {
      let i = 0;
      const total = txCount;

      // Order matters only loosely (each contract is independent). Tear down
      // the dispatcher recipe first so a stale recipe can't fire actions
      // against a half-deleted vault, then the vault, then the gate entry,
      // then finally the verifier commitment.
      if (entry.hasSecret) {
        i++;
        setDeleteState({ busy: true, status: `Tx ${i}/${total} — deconfigure recipe…` });
        const tx = await writeContractAsync({
          chainId: SEPOLIA_CHAIN_ID,
          address: addresses.compositeAction,
          abi: compositeActionAbi,
          functionName: "deconfigure",
          args: [entry.id],
        });
        await wait("deconfigure", tx);

        i++;
        setDeleteState({ busy: true, status: `Tx ${i}/${total} — delete vault…` });
        const tx2 = await writeContractAsync({
          chainId: SEPOLIA_CHAIN_ID,
          address: addresses.secretReleaseAction,
          abi: secretReleaseActionAbi,
          functionName: "deleteVault",
          args: [entry.id],
        });
        await wait("deleteVault", tx2);
      }

      i++;
      setDeleteState({ busy: true, status: `Tx ${i}/${total} — delete gate entry…` });
      const txGate = await writeContractAsync({
        chainId: SEPOLIA_CHAIN_ID,
        address: addresses.ghostGate,
        abi: ghostGateAbi,
        functionName: "deleteEntry",
        args: [entry.id],
      });
      await wait("deleteEntry", txGate);

      i++;
      setDeleteState({ busy: true, status: `Tx ${i}/${total} — decommit password…` });
      const txDec = await writeContractAsync({
        chainId: SEPOLIA_CHAIN_ID,
        address: addresses.fheEqVerifier,
        abi: fheEqVerifierAbi,
        functionName: "decommit",
        args: [entry.id],
      });
      await wait("decommit", txDec);

      onForget();
    } catch (e) {
      setDeleteState({ busy: false, error: toErrorMessage(e) });
    }
  }


  async function onTry(e: React.FormEvent) {
    e.preventDefault();
    if (!publicClient || !walletClient) return;
    if (!guess) return;

    setAttempt({ status: "encrypting" });
    try {
      // Encrypted guess always flows through the gate (it's the verifier's
      // direct caller), so the input proof binds to (verifier, gate)
      // regardless of whether we then call gate.check directly (phase 1) or
      // route through compositeAction.fire (phase 2).
      const enc = await encryptPassword(
        guess,
        addresses.fheEqVerifier,
        addresses.ghostGate,
      );
      const verifierData = encodeAbiParameters(
        [{ type: "bytes32" }, { type: "bytes" }],
        [enc.handle, enc.proof],
      );

      setAttempt({ status: "submitting" });
      const txHash = entry.hasSecret
        ? await writeContractAsync({
            chainId: SEPOLIA_CHAIN_ID,
            address: addresses.compositeAction,
            abi: compositeActionAbi,
            functionName: "fire",
            args: [entry.id, verifierData, entry.owner],
            value: feeWei,
          })
        : await writeContractAsync({
            chainId: SEPOLIA_CHAIN_ID,
            address: addresses.ghostGate,
            abi: ghostGateAbi,
            functionName: "check",
            args: [entry.id, verifierData, entry.owner],
            value: feeWei,
          });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted.");
      }

      if (entry.hasSecret) {
        // Phase 2: parse the Released event from SecretReleaseAction and
        // user-decrypt the released euint256. A non-zero plaintext is the
        // stored secret; zero means the verdict was false.
        let releasedHandle: Hex | null = null;
        for (const log of receipt.logs) {
          try {
            const parsed = decodeEventLog({
              abi: secretReleaseActionAbi,
              data: log.data,
              topics: log.topics,
              strict: false,
            });
            if (parsed.eventName === "Released") {
              const args = parsed.args as {
                released: Hex;
                vaultId: Hex;
                recipient: Address;
              };
              if (args.vaultId.toLowerCase() === entry.id.toLowerCase()) {
                releasedHandle = args.released;
                break;
              }
            }
          } catch {
            /* skip */
          }
        }
        if (!releasedHandle) {
          throw new Error("Released event not found — composite recipe wired up?");
        }

        setAttempt({
          status: "decrypting",
          releasedHandle,
          txHash,
          message: "Sign the EIP-712 request to decrypt the released secret.",
        });

        const value = await decryptEuint256({
          handle: releasedHandle,
          contractAddress: addresses.secretReleaseAction,
          userAddress: getAddress(entry.owner),
          walletClient,
        });
        const releasedSecret = secretFromU256(value);

        setAttempt({
          status: "done",
          verdict: releasedSecret !== null,
          releasedSecret,
          releasedHandle,
          txHash,
        });
      } else {
        // Phase 1 (legacy): parse CheckAttempted and decrypt the ebool.
        let verdictHandle: Hex | null = null;
        for (const log of receipt.logs) {
          try {
            const parsed = decodeEventLog({
              abi: ghostGateAbi,
              data: log.data,
              topics: log.topics,
              strict: false,
            });
            if (parsed.eventName === "CheckAttempted") {
              const args = parsed.args as {
                verdict: Hex;
                id: Hex;
                caller: Address;
              };
              if (args.id.toLowerCase() === entry.id.toLowerCase()) {
                verdictHandle = args.verdict;
                break;
              }
            }
          } catch {
            /* skip */
          }
        }
        if (!verdictHandle) {
          throw new Error("CheckAttempted event not found in tx logs.");
        }

        setAttempt({
          status: "decrypting",
          verdictHandle,
          txHash,
          message: "Sign the EIP-712 request to decrypt the verdict.",
        });

        const verdict = await decryptEbool({
          handle: verdictHandle,
          contractAddress: addresses.ghostGate,
          userAddress: getAddress(entry.owner),
          walletClient,
        });

        setAttempt({ status: "done", verdict, verdictHandle, txHash });
      }
      setGuess("");
    } catch (e) {
      setAttempt({ status: "error", message: toErrorMessage(e) });
    }
  }

  return (
    <li className="border border-neutral-900 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            {entry.label ? (
              <span className="text-sm text-white">{entry.label}</span>
            ) : null}
            <span
              className={`font-mono text-[10px] tracking-widest uppercase ${
                entry.hasSecret ? "text-emerald-400" : "text-neutral-500"
              }`}
              title={
                entry.hasSecret
                  ? "Phase 2: password unlocks an encrypted secret."
                  : "Phase 1: password yields an encrypted verdict only."
              }
            >
              {entry.hasSecret ? "secret" : "verdict-only"}
            </span>
          </div>
          <div className="font-mono text-xs break-all text-neutral-500">
            {entry.id}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            disabled={deleteState.busy}
            className="text-xs text-rose-400 transition hover:text-rose-300 disabled:opacity-50"
            title={`Delete on-chain (${entry.hasSecret ? 4 : 2} txs).`}
          >
            {deleteState.busy ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={onForget}
            disabled={deleteState.busy}
            className="text-xs text-neutral-500 transition hover:text-neutral-300 disabled:opacity-50"
            title="Remove from local cache only (the entry stays on-chain)"
          >
            Forget
          </button>
        </div>
      </div>
      <dl className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs text-neutral-500">
        <div>
          <dt className="text-neutral-600 uppercase tracking-widest">Cooldown</dt>
          <dd>{entry.cooldownSec}s</dd>
        </div>
        <div>
          <dt className="text-neutral-600 uppercase tracking-widest">Fee</dt>
          <dd>{formatEther(feeWei)} ETH</dd>
        </div>
      </dl>

      <form onSubmit={onTry} className="space-y-2">
        <input
          type="password"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Try a password…"
          className={inputCls}
          autoComplete="off"
          disabled={isWorking(attempt.status) || deleteState.busy}
        />
        <button
          type="submit"
          disabled={isWorking(attempt.status) || deleteState.busy || !guess}
          className="border border-neutral-700 px-4 py-2 text-sm font-medium text-white transition hover:border-neutral-500 disabled:opacity-50"
        >
          {labelForAttempt(attempt.status)}
        </button>
      </form>

      <AttemptResult attempt={attempt} />

      {deleteState.status ? <Note>{deleteState.status}</Note> : null}
      {deleteState.error ? <ErrorBox>{deleteState.error}</ErrorBox> : null}
    </li>
  );
}

function AttemptResult({ attempt }: { attempt: AttemptState }) {
  if (attempt.status === "idle") return null;
  if (attempt.status === "error") {
    return <ErrorBox>{attempt.message ?? "Unknown error."}</ErrorBox>;
  }
  if (attempt.status === "done") {
    const granted = attempt.verdict;
    const handle = attempt.releasedHandle ?? attempt.verdictHandle;
    return (
      <div
        className={`mt-3 border px-3 py-2 text-sm ${
          granted
            ? "border-emerald-700 bg-emerald-950/30 text-emerald-200"
            : "border-rose-700 bg-rose-950/30 text-rose-200"
        }`}
      >
        {attempt.releasedHandle ? (
          granted ? (
            <>
              <div className="font-mono text-xs tracking-widest uppercase">
                Secret released
              </div>
              <div className="mt-1 break-all font-mono text-base text-emerald-100">
                {attempt.releasedSecret}
              </div>
            </>
          ) : (
            <div className="font-mono text-xs tracking-widest uppercase">
              Wrong password — released ciphertext decrypts to zero.
            </div>
          )
        ) : (
          <div className="font-mono text-xs tracking-widest uppercase">
            Verdict: {granted ? "true (access granted)" : "false (denied)"}
          </div>
        )}
        {attempt.txHash ? (
          <div className="mt-2 font-mono text-xs text-neutral-400 break-all">
            tx {attempt.txHash}
          </div>
        ) : null}
        {handle ? (
          <div className="font-mono text-xs text-neutral-500 break-all">
            handle {handle}
          </div>
        ) : null}
      </div>
    );
  }
  return <Note>{labelForAttempt(attempt.status)}…</Note>;
}

// --- small helpers ----------------------------------------------------------

function isWorking(s: AttemptState["status"]): boolean {
  return s === "encrypting" || s === "submitting" || s === "decrypting";
}

function labelForAttempt(s: AttemptState["status"]): string {
  switch (s) {
    case "encrypting":
      return "Encrypting guess";
    case "submitting":
      return "Submitting check";
    case "decrypting":
      return "Decrypting";
    default:
      return "Try password";
  }
}

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function toErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "shortMessage" in e) {
    const sm = (e as { shortMessage?: unknown }).shortMessage;
    if (typeof sm === "string") return sm;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

const inputCls =
  "w-full border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs tracking-widest text-neutral-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs text-neutral-300 break-all">{children}</code>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 font-mono text-xs text-neutral-400">{children}</p>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border border-rose-800 bg-rose-950/30 px-3 py-2 font-mono text-xs text-rose-300 break-all">
      {children}
    </p>
  );
}
