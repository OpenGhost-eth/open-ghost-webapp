import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <div className="font-mono text-sm tracking-tight text-white">
          open-ghost
        </div>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
          <Link className="transition hover:text-white" href="/demo">
            Demo
          </Link>
          <Link className="transition hover:text-white" href="/downloads">
            Downloads
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-20 pb-32">
        <p className="mb-6 font-mono text-xs tracking-widest text-neutral-500 uppercase">
          Built on Zama fhEVM
        </p>
        <h1 className="mb-8 text-4xl leading-tight font-medium tracking-tight text-white sm:text-5xl md:text-6xl">
          An on-chain registry that binds any id to a custom predicate
          contract — and returns its verdict as a ciphertext only the caller
          can decrypt.
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
          Success and failure are indistinguishable to every other observer.
          A drop-in private authentication primitive for the rest of the EVM.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/demo"
            className="inline-flex items-center bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Try the demo →
          </Link>
          <Link
            href="/downloads"
            className="inline-flex items-center border border-neutral-700 px-5 py-2.5 text-sm font-medium transition hover:border-neutral-500 hover:text-white"
          >
            Downloads
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-900">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
              Encrypted verdicts
            </h2>
            <p className="leading-relaxed text-neutral-300">
              Each entry returns its{" "}
              <code className="font-mono text-sm text-neutral-100">check()</code>{" "}
              result as an encrypted boolean. The ACL is granted to the caller,
              who decrypts off-chain. On-chain observers learn nothing about
              the outcome.
            </p>
          </div>
          <div>
            <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
              Anti-griefing baked in
            </h2>
            <p className="leading-relaxed text-neutral-300">
              A per-caller cooldown clamped to{" "}
              <code className="font-mono text-sm text-neutral-100">
                [30s, 365 days]
              </code>{" "}
              and an attempt fee paid to the entry owner on every call —
              successful or not. Brute-force becomes linearly priced; hostile
              traffic becomes revenue.
            </p>
          </div>
          <div>
            <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
              Composable predicates
            </h2>
            <p className="leading-relaxed text-neutral-300">
              <code className="font-mono text-sm text-neutral-100">
                CompositeVerifier
              </code>{" "}
              stitches sub-verifiers via AND / OR / XOR / NOT / EQ / NE
              recipes.{" "}
              <code className="font-mono text-sm text-neutral-100">
                CompositeAction
              </code>{" "}
              dispatches a sequence of follow-ups atomically on a true
              verdict.
            </p>
          </div>
          <div>
            <h2 className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
              Drop-in EVM primitive
            </h2>
            <p className="leading-relaxed text-neutral-300">
              Any contract can call{" "}
              <code className="font-mono text-sm text-neutral-100">check()</code>{" "}
              and gate its own logic on the encrypted verdict. Bring your own{" "}
              <code className="font-mono text-sm text-neutral-100">
                IFheAuthVerifier
              </code>{" "}
              — the registry is verifier-agnostic.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-900">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <p className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase">
            Reference implementation
          </p>
          <h2 className="mb-6 max-w-3xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Permissionless cloud storage of a 32-byte secret with
            military-grade security.
          </h2>
          <p className="mb-10 max-w-2xl leading-relaxed text-neutral-400">
            Register a password-gated entry. Anyone holding the password can
            unlock the secret. Anyone else just sees encrypted noise — and
            pays the attempt fee for the privilege of trying.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center border-b border-white pb-1 text-sm font-medium text-white transition hover:border-neutral-400 hover:text-neutral-300"
          >
            Try the demo →
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-xs text-neutral-500">
          <div>open-ghost · MIT</div>
          <div className="flex gap-6">
            <Link className="transition hover:text-neutral-300" href="/demo">
              Demo
            </Link>
            <Link
              className="transition hover:text-neutral-300"
              href="/downloads"
            >
              Downloads
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
