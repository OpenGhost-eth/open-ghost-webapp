# open-ghost-webapp

Public-facing web app for the OpenGhost project.

## Pages

1. **Landing** — what OpenGhost is, the high-level pitch.
2. **Demo** — interactive reference implementation. A user creates, manages, and accesses a cloud-stored secret protected by a password (passkey support to follow).
3. **Downloads** — links to the GitHub repositories with a short description of each part of the project (contracts, SDK, CLI, MCP server, etc.).

## Stack

- Next.js (App Router) + TypeScript
- Wallet / chain interaction via wagmi + viem
- Zama fhEVM client library for FHE encryption on the demo page
- WebAuthn (passkeys) — planned, not in the initial cut

## Status

Not yet scaffolded. This directory currently contains only planning docs.

## Development

To be filled in once the app is scaffolded. The site targets Sepolia and talks to the live `GhostGate` stack documented in `../open-ghost-contracts/CLAUDE.md`.
