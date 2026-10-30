# TypeScript conformance intake certification

**Scope:** Verification evidence that the vendored conformance intake matches
its pinned upstream sources

This record certifies the intake described by `PROVENANCE.json`. It is
verification evidence, not a contract. A compatibility-reference upgrade
replaces this certification together with the intake it describes.

## 1. Method

Performed 2026-08-18 and extended with the diagnostic-definition intake on
2026-08-22. Each pinned upstream source was fetched fresh from its
authority, the declared selection was re-derived from the declared upstream
roots, and both sides were compared by SHA-256 content hash over sorted
relative-path listings. Identical listings prove, in one comparison, that the
local intake is complete, contains nothing beyond the declared selection, and
modifies nothing. Locally installed `node_modules` content was not used as
evidence.

Upstream inputs fetched:

| Source | Identity | Archive SHA-256 |
|---|---|---|
| `microsoft/typescript-go` | commit `2bd066d87f5bafd315be9f40889d0a60b9e58e0b` | `5ccb47dbb3f68cd0da58b71e6f445eee36a50bd3e9f9f330cc23a97b88500119` |
| `microsoft/TypeScript` | commit `4d4f005c8541e0255a9d8791205fdce326e462bc` | `99cbcb9abf5308b15e90b991919b3f897918f5c19c13dce3a4d3cab618c64bf9` |
| `@typescript/typescript-win32-x64` | npm version `7.0.2` | `61fc4e141d2bc687db580e71bbfa63b9c209f0310645d82ca1b457eb3a24fd19` |

The trust base is GitHub's commit-hash archive service and the npm registry's
version tarball for the exact pinned identities.

## 2. Results

| Local root | Files | Verdict |
|---|---:|---|
| `cases/native` | 317 | Byte-identical |
| `baselines/native` | 135 | Byte-identical |
| `cases/classic` | 12,445 | Byte-identical |
| `baselines/classic` | 7,033 | Byte-identical |
| `diagnostic-definitions/classic` | 1 | Byte-identical |
| `diagnostic-definitions/native` | 1 | Byte-identical |
| `libraries` | 108 | Byte-identical |
| `licenses` | 4 | Byte-identical |

Supporting observations:

- The upstream `tests/cases/compiler` and `tests/cases/conformance` trees
  contain exactly 12,445 files; the "every file" intake claim required no
  filtering.
- The upstream `testdata/tests/cases` root contains only `compiler` and
  `conformance` entries; the native intake is its complete content.
- The 33 native diagnostic definitions overlay the 2,130 classic definitions
  by code, replacing 9 definitions and producing 2,154 effective definitions.
- The only `lib/` entry not vendored from the npm package is `tsc.exe`, which
  the `lib*.d.ts` selection correctly excludes.

## 3. Section digests

SHA-256 of each section's sorted `hash path` listing, for future
re-verification:

| Section | Listing digest |
|---|---|
| Native cases | `7311138b36610bd0dd6d1b88a3adf30e3d308240e29de591079ef3837fd5dbcb` |
| Native baselines | `4761a96598b56a5131dae1cc98b5b0fa2db9365fadf5a7859bc3688c20315327` |
| Classic cases | `de336b3de4d5aba1002b2393021c72835008304889e769e3998f5f6bc28bdf20` |
| Classic baselines | `80cbb2b1941cac22e4ae7ad6b35db274775f8457844242f0b37b9eedc3e85433` |
| Classic diagnostic definitions | `aa0c2e31ca913369619fec3ba266bedf9cad5dda9e2b37e754040901af00a38f` |
| Native diagnostic definitions | `f3cdcb404fc84f79c812300125b5bb2c7d534eb592fbd0bc55a9c3a54649f7bf` |
| Libraries | `cec28dcf4f0c39803e30af527af1e12750e5ebcb79ad8d912fa9fb227ba1b680` |

## 4. Verdict

`PROVENANCE.json` is accurate in every checkable claim. The intake claim is
**Verified** under the claims discipline of the repository's `AGENTS.md`.

`npm run vendor:typescript` now mechanizes this procedure; section 5 records
its reproduction of this intake.

## 5. Reproduction by the vendor command

Performed 2026-09-22 with `npm run vendor:typescript -- 7.0.2`, which resolved
`typescript/v7.0.2` through GitHub to TypeScript-Go
`2bd066d87f5bafd315be9f40889d0a60b9e58e0b` and its TypeScript submodule
`4d4f005c8541e0255a9d8791205fdce326e462bc`, fetched both commit archives and
the `@typescript/typescript-win32-x64` 7.0.2 package, whose bytes matched the
integrity the npm registry records, replaced every vendored directory, and
regenerated the expected diagnostics with the pinned compiler.

| Output | Result |
|---|---|
| `cases/`, `baselines/`, `diagnostic-definitions/`, `libraries/`, `licenses/` | Byte-identical to the committed intake: 12,762, 7,168, 2, 108, and 4 files |
| `PROVENANCE.json` | Byte-identical to the committed file |
| `expected/diagnostics.jsonl` | Byte-identical, SHA-256 `a542026b9792f09fe8a9384248018d4c28d7863eea6de8dbb46104a571a6f1f4` |
| `expected/MANIFEST.json` | Byte-identical, SHA-256 `b1cbc955136adc29d84c90d33835024ebd10440910e2a578519e709aaae1b6aa`; no case was asked twice |

After review corrections to the command, a second run wrote the intake into a
scratch directory and was stopped before regenerating the expected
diagnostics; its intake and `PROVENANCE.json` were again byte-identical.

This certifies that the intake is the pinned upstream selection, unchanged,
and that the expected diagnostics reproduce from it under the canonical
invocation. It does not show that the splitting rule or the extraction
matches the reference harness; `TYPESCRIPT-COMPATIBILITY.md` owns what the
intake's certification covers.
