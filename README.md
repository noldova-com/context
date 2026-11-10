# Context

[![Build and test](https://github.com/noldova-com/context/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/noldova-com/context/actions/workflows/build-and-test.yml)
[![npm](https://badgen.net/npm/v/@noldova/context.core)](https://www.npmjs.com/package/@noldova/context.core)
[![License: MIT](https://badgen.net/static/license/MIT/blue)](LICENSE)

**TypeScript libraries for collections, exceptions, text, JSON, testing and parsing, with no third-party runtime dependencies.**

They're the first parts of CONTEXT, Noldova's platform for taking TypeScript sources to portable and native programs.
The compiler, Runtime and SDK are designed in [documents/](documents/), as [VISION.md](documents/VISION.md) says, and aren't built yet.

Every package is at `0.0.x` for now, and its API may change from one version to the next until the first public release.

## Getting started

Each package installs on its own from npm, with the CONTEXT packages it depends on:

```bash
npm install @noldova/context.json
```

```ts
import { JsonReader } from "@noldova/context.json";

const reader = JsonReader.parse("{\"name\":\"Fixture\",\"version\":2}");
const name = reader.readString("name");
const version = reader.readInteger("version");
```

A field that is absent, `null` or of the wrong type throws `JsonException`, whose `path`, such as `$.version`, says which field is wrong.
Each package's declarations, `api/index.d.ts`, document its whole public API with examples.

## Packages

Each name opens the package's folder and its own README; each badge opens it on npm.

### Foundation

| Package | npm | What it is |
|---|---|---|
| [`context.core`](src/noldova.context.core) | [![npm](https://badgen.net/npm/v/@noldova/context.core)](https://www.npmjs.com/package/@noldova/context.core) | The lowest library: `nameof`, checked against a type when it compiles, and helpers on `Object` and `String` that every other package builds on |
| [`context.exceptions`](src/noldova.context.exceptions) | [![npm](https://badgen.net/npm/v/@noldova/context.exceptions)](https://www.npmjs.com/package/@noldova/context.exceptions) | An `Exception` base and argument guards that check a value and narrow its type in one call |
| [`context.collections`](src/noldova.context.collections) | [![npm](https://badgen.net/npm/v/@noldova/context.collections)](https://www.npmjs.com/package/@noldova/context.collections) | Collection algorithms, such as a binary search over sorted numbers |
| [`context.text`](src/noldova.context.text) | [![npm](https://badgen.net/npm/v/@noldova/context.text)](https://www.npmjs.com/package/@noldova/context.text) | A string builder, read-only views of part of a string, line endings, and Unicode identifier rules |

### Data

| Package | npm | What it is |
|---|---|---|
| [`context.json`](src/noldova.context.json) | [![npm](https://badgen.net/npm/v/@noldova/context.json)](https://www.npmjs.com/package/@noldova/context.json) | Reads untrusted JSON into typed values, and says by path which field is wrong |
| [`context.data`](src/data/noldova.context.data) | [![npm](https://badgen.net/npm/v/@noldova/context.data)](https://www.npmjs.com/package/@noldova/context.data) | A database-independent data model: connections, transactions, migrations and a change feed, which a provider implements |
| [`context.data.sql`](src/data/noldova.context.data.sql) | [![npm](https://badgen.net/npm/v/@noldova/context.data.sql)](https://www.npmjs.com/package/@noldova/context.data.sql) | The data model over SQL: a schema and migration builder, SQL dialects, and SQL connections, migrations and change feed |
| [`context.data.sql.sqlite`](src/data/noldova.context.data.sql.sqlite) | [![npm](https://badgen.net/npm/v/@noldova/context.data.sql.sqlite)](https://www.npmjs.com/package/@noldova/context.data.sql.sqlite) | The SQLite provider of the SQL data model, on the host's `node:sqlite` |
| [`context.data.sql.postgresql`](src/data/noldova.context.data.sql.postgresql) | [![npm](https://badgen.net/npm/v/@noldova/context.data.sql.postgresql)](https://www.npmjs.com/package/@noldova/context.data.sql.postgresql) | The PostgreSQL provider of the SQL data model, ported from postgres.js |

### Testing

| Package | npm | What it is |
|---|---|---|
| [`context.testing`](src/noldova.context.testing) | [![npm](https://badgen.net/npm/v/@noldova/context.testing)](https://www.npmjs.com/package/@noldova/context.testing) | A test framework: test classes with decorators, run in parallel worker threads, with timeouts and code coverage |

### Diagnostics and parsers

| Package | npm | What it is |
|---|---|---|
| [`context.diagnostics`](src/noldova.context.diagnostics) | [![npm](https://badgen.net/npm/v/@noldova/context.diagnostics)](https://www.npmjs.com/package/@noldova/context.diagnostics) | Diagnostics with codes, categories, messages and source locations, as parsers and tools report them |
| [`context.parsers`](src/parsers/noldova.context.parsers) | [![npm](https://badgen.net/npm/v/@noldova/context.parsers)](https://www.npmjs.com/package/@noldova/context.parsers) | The base for language parsers: sources with spans and line positions, a reader, and lexer and parser classes |
| [`context.parsers.regex`](src/parsers/noldova.context.parsers.regex) | [![npm](https://badgen.net/npm/v/@noldova/context.parsers.regex)](https://www.npmjs.com/package/@noldova/context.parsers.regex) | A parser for JavaScript regular expressions, aligned with TypeScript 7.0.2 and Unicode 15.1, that reports every syntax error without running the pattern |
| [`context.parsers.typescript`](src/parsers/noldova.context.parsers.typescript) | [![npm](https://badgen.net/npm/v/@noldova/context.parsers.typescript)](https://www.npmjs.com/package/@noldova/context.parsers.typescript) | A TypeScript parser that turns sources and declaration files into a syntax tree, with TypeScript's error codes, and still yields a tree from a broken file |

## How it's built

- **No third-party runtime dependencies.** Each package depends only on other CONTEXT packages.
- **Every file fully covered.** A full test run fails unless every source file is fully covered; on `main` today, over 21,000 tests pass with every file covered.
- **Six targets.** Each change is built and tested on Linux, Windows and macOS, on x64 and arm64.
- **Reproducible.** A second build of the same commit packs byte-identical archives.
- **Published from `main`** by the release workflow, with npm provenance, so each version names the commit it was built from.
- **Documented.** Each package's `api/index.d.ts` documents its whole public API, with examples.

## Build and test

The toolchain is Node.js 24.21.0 with npm 11.19.0, as `package.json` pins them.

```bash
npm run build
```

```bash
npm test
```

`npm run build` installs the two locked development packages, TypeScript and Node.js's type declarations, without running their install scripts; then it builds, packs and installs every CONTEXT package into `_build/` and `_packages/`, at the version `version.json` holds; after each package it installs every archive packed so far with `npm install --no-save`, so the next package builds against them and none enters `package.json` or `package-lock.json`.
It writes `Building "<package>"...` for each and ends the line with ` Done.` or ` Failed.`.
The build writes the checkout's head commit into every package's `package.json` as `gitHead`, so each published version names the commit it was built from; it fails before building when git can't read the commit.
`npm run build --silent -- --list-copies` builds nothing and prints each file the build copies into a package, one per line, with tabs between its source, the package's name and its path inside the package, and then `end of copies`.
`npm test` runs the whole suite, including the vendored conformance cases.
Both entry points live in `scripts/`.
Two options shorten its output, as the CI run uses them:

```bash
npm test -- --skip-test-details --skip-coverage-details
```

- `--skip-test-details` hides the line of each passing test; failures, skipped tests and the totals still print.
- `--skip-coverage-details` hides the coverage rows of fully covered files; files with gaps and the overall row still print.

## Running tests from an app

An app runs its compiled tests in parallel workers through `ParallelTestRunner` from `@noldova/context.testing`, as the command-line run does:

```ts
const result = await new ParallelTestRunner(30_000).runAsync([new TestProject("Sample", compiledTestDirectory)], filters, listener);
```

- **The workers:** one per available processor and at least two by default; the constructor's second argument sets another number.
- **A test that overruns** its timeout, including one that blocks synchronously, is recorded as timed out, its worker is ended, and a fresh worker resumes after it; the run goes on.
- **The result** is the `TestRunResult` that `TestRunner` returns. A value that can't cross between threads, such as a class instance in a test's data, arrives as a value that prints as the original did, so `TestReportWriter` prints the same lines from either runner.
- **The listener** hears `onMethodCompleted` as each test ends and `onClassCompleted` in discovery order. `onMethodStarted` is never called, because only the workers load the test modules; loading them in the app's thread too would run their top-level code twice.
- **The run fails,** after every worker has ended, when a worker crashes, starts no test within its limit or discovers different tests from another, or when a class leaves a timer or handle open.
- **Temporary files:** the runner leaves the environment as it is; an app that wants its tests' temporary files in a folder of their own sets `TMPDIR`, `TEMP` and `TMP` before the run.

[TESTING-CONTRACT.md](documents/TESTING-CONTRACT.md) owns these rules.


## Checks

Every pull request into `main` must pass both checks before it merges.

No test code pauses for a fixed time.

| Check | What it verifies |
|---|---|
| Check / Linked issue | `.github/workflows/require-linked-issue.yml`, the "PR" workflow: the PR description has a standalone `Issue: #N`, `Issue #N` or closing reference, such as `Closes #N`, that names an issue in this repository. |
| Check / Runner / Versions | The shared check's own call of the shared settings, which name the runner "Check / Linked issue" uses. |
| Build and test / Versions / Versions | The organization's shared settings, `.github`'s `versions.yml`, name the Node.js and npm versions and the runner for each target that "Build and test" uses. |
| Build and test / Linux x64, Linux arm64, Windows x64, Windows arm64, macOS x64, macOS arm64 | One job per target of `.github`'s shared `build-and-test.yml`, each on the GitHub-hosted runner the shared settings name for it: `npm run build` installs the locked third-party packages with `npm ci --ignore-scripts`, then builds, packs and installs every package; the toolchain is the Node.js and npm versions the shared settings name, Node.js 24.21.0 with npm 11.19.0 today; `.gitattributes` holds `* text=auto eol=lf`, and every tracked text file outside the vendored inputs, which their own `.gitattributes` marks `-text`, uses LF line endings and ends with exactly one newline; `npm test` runs the whole suite, and the build and the tests leave every tracked file unchanged; a second build of the commit, in another folder, packs byte-identical archives; and the archives pass the release's own check at the version `version.json` holds. |
| Build and test / All targets | All six targets' jobs passed, and the shared settings named the versions and a runner for each target; it reports even when a job before it failed or was skipped, so `main` can require it. |


## Releases

The packages are published to npm under `@noldova` from `main` by the release workflow, `.github/workflows/release-npm.yml`, with provenance.
The first publish of a new package uses a one-time token, `NPM_FIRST_PUBLISH_TOKEN`, which the Owner sets in the `release` environment, since npm's trusted publishing needs each package to exist; every later publish uses trusted publishing, without a stored token.
Their versions follow [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md).
Each version changes `version.json` in a pull request that writes the version's section of [CHANGELOG.md](CHANGELOG.md), from the pull requests merged since the previous version.
The release tags the commit `v<version>` first, before it builds or publishes; a version whose build or publish then fails keeps its tag, so releasing other changes needs a new version.
After a release, the workflow proposes the version to each public repository that pins these packages, in one pull request each, through a GitHub App whose key the `version-updates` environment holds.


## License

CONTEXT is licensed under the [MIT License](LICENSE).

It includes third-party material under its own licenses:

| What | Where | License |
|---|---|---|
| TypeScript's and typescript-go's test cases and baselines, vendored as conformance evidence | `src/parsers/noldova.context.parsers.typescript/tests/conformance/` | Apache License 2.0, Copyright (c) Microsoft Corporation, in `licenses/` beside them |
| The message text of TypeScript's diagnostics, in the published `@noldova/context.parsers.typescript` | `src/parsers/noldova.context.parsers.typescript/src/models/diagnostics/typescript-diagnostic-templates.ts` | Apache License 2.0, in the package's `THIRD-PARTY-NOTICES.txt` |
| Test262's regular-expression tests, vendored as conformance evidence | `src/parsers/noldova.context.parsers.regex/tests/conformance/` | BSD License, Copyright (c) Ecma International, in `licenses/` beside them |
| Identifier tables generated from the Unicode Character Database, in the published `@noldova/context.text` | `src/noldova.context.text/src/services/unicode-code-point.service.ts` | Unicode License v3, in the package's `THIRD-PARTY-NOTICES.txt` |

TypeScript, Microsoft, Test262, ECMAScript, Node.js and V8 are names of their owners.
