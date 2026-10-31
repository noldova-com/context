# CONTEXT versioning and compatibility

**Scope:** Development product and package versions, internal contract versions, development compatibility, external version authorities, and the release transition

## 1. Two development values

Until a later accepted decision declares a public release policy, CONTEXT uses exactly two kinds of version value:

| Boundary | Value |
|---|---:|
| Every CONTEXT-owned product and package, including the `noldova.context` command host, every `noldova.context.*` package, the Runtime, the SDK, every tool, and the bootstrap npm metadata | `0.0.<n>`, one number for all, starting at `0.0.1` |
| Every CONTEXT-owned file format, schema, contract, protocol, instruction set, metadata format, or ABI that requires a version field | integer `1` |

They identify the current development line, not a compatibility family.
Age, feature count, milestones, distribution to another machine, or use by another Noldova project does not turn them into a stable public contract.

Only the last number goes up, and only when the packages are published: a publish run is started by hand, when a maintainer decides, and it publishes every package at the next number, as the README's [Releases](../README.md#releases) says.
Major and minor stay `0` until the first public release, and the internal version stays `1`.
The one number lives in `scripts/config.ts`; the bootstrap `package.json` files write `__VERSION__` for their own version and for CONTEXT-owned dependencies, and the build fills it in.
Until CONTEXT compiles itself, the `.ctxp` project manifests keep `0.0.1`, since nothing reads their version yet.
The repository's root `package.json` and its lockfile have no version, since they are never published.
CONTEXT-owned dependencies name the current number exactly: no caret, tilde, wildcard, range, floating tag, prerelease counter, date version, commit suffix, or independently incremented package version.
The packages are published to npm under `@noldova`.

The internal version is the integer `1`, not `1.0`, `v1`, `0.0.1`, or a counter per revision.
Add a version field only where a consumer validates a persistent or process boundary; nested redundant version fields create multiple authorities and are prohibited.
`.ctxs` and `.ctxp` manifests encode no schema-version field; their extensions and strict current-shape validation identify the schema.
A version-1 contract may change in place: the contract, writer, reader, validator, tests, fixtures, and generated artifacts change together, and the repository retains no earlier meaning of version `1`.

## 2. No development compatibility

CONTEXT makes no backward- or forward-compatibility promise between development revisions, even when both sides report the same `0.0.<n>` and version `1`.
Do not add legacy readers or writers, migration or upgrade pipelines, field aliases, deprecated fields retained for compatibility, dual encoding, version negotiation or feature handshakes, probing of historical layouts, fallback parsing after current validation fails, or special cases for historical artifacts.

When a contract changes: change the owning contract; change every producer and consumer atomically; replace tests and fixtures rather than preserving obsolete cases as accepted behavior; delete generated, cached, installed, and generation outputs; rebuild the affected dependency closure; and verify only the new state.
A historical test is retained only when it still proves a current invariant or is clearly isolated as historical evidence.

## 3. Same version does not mean compatible

The canonical workflow uses one exact compatible closure: packages freshly built, packed, and installed from the same source state; a compiler consuming only that closure; the SDK and Runtime as the exact pair selected by the build; and self-host and AOT steps recording the exact identities they consumed.

An older development artifact is disposable.
The owning artifact, Runtime, SDK, package, or distribution schema defines an exact development compatibility identity: deterministic, host-independent, derived only from declared compatibility-relevant inputs, never from absolute paths, timestamps, machine or process identity, locale, or wall-clock time.
A declared byte-neutral change, such as documentation, must not alter code-bearing artifacts merely because a commit changed.

A consumer accepts only its current version-1 representation and exact compatibility boundary.
It fails explicitly on an absent required version field, any internal version other than `1`, a malformed or duplicate version field, a mismatched compatibility identity, a stale closure, or a historical field, alias, format, or migration request.
Failure triggers no probing, migration, defaulting, nearest-version, same-version guess, or source fallback, and a rejected input is never published, installed, loaded, linked, translated, or executed.
An unknown future version and a known obsolete representation are both unsupported.

## 4. External version authorities

The fixed CONTEXT values do not replace external versions.
TypeScript, Node, npm, direct third-party dependencies, vendored corpora, and specification editions (ECMAScript, Unicode, PE/COFF, ELF, Mach-O, DWARF, operating-system, kernel, architecture, and platform ABI authorities) retain their real exact identities under their owning documents.
Target-native container and ABI version fields follow their external formats; only a CONTEXT-owned contract layered over them uses version `1`.
Changing an external pin does not change the CONTEXT values.

## 5. Public release transition

The first public release requires a new accepted decision that defines public versions, whether packages version together, which boundaries are stable, compatibility promises, upgrade paths, deprecation and support lifetimes, registry policy, Runtime and SDK compatibility selection, and release gates.
It may replace every development number and representation without a compatibility bridge.
No implementation prepares speculative compatibility infrastructure for it.
