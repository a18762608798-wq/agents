# Pi engine provenance

* Canonical Pi source: `../pi/speckit-rework-gate.ts` (relative to this Codex package)
* Previous global location: `~/.pi/agent/extensions/speckit-rework-gate.ts` (removed from global loading)
* Original SHA-256: `ba0dfb548ff293c4b16adeb58f1101b599a9fd912e87fc7bf67561e42ae30a7a`
* Vendored file: `vendor/pi-speckit-rework-gate.ts`

Only four source-level changes are made to the copied engine:

1. Replace the Pi mutation-queue runtime import with `scripts/pi-shim.mjs`.
2. Replace TypeBox with a small JSON Schema construction shim.
3. Anchor official-command bypass to an actual leading `/speckit.*` command.
4. Export the existing shell tokenizer for the Codex adapter's extra checks.

The seven tool implementations, stage hashes/checklists, artifact classification,
scope matching, symlink checks and shell parser otherwise remain the Pi source.
Type-only Pi imports are erased by Node.js native TypeScript stripping; Pi is not
required at runtime. Requires Node.js 22.19+ (this machine has 22.23 and 24.22).

The host adapter deliberately tightens some behavior: session-bound one-use tool
capabilities, durable transactions, blocked-state explicit reset, per-path patch
checks (including both rename endpoints), frozen Codex/Git executable config,
artifact checks at close, and rejection of shell writes/interactive/delegated or
unknown tool paths while a rework transaction is active. These differences are
not claimed to be identical to the Pi plugin. See `../README.md` for the shared
project-installation guide. No project is enabled by moving these sources.
