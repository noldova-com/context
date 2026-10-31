# Context

Noldova's TypeScript foundation libraries, `noldova.context.*`, published on npm as `@noldova/context.*`, and the start of the CONTEXT platform built on them: a compiler, Runtime and SDK that take TypeScript sources to portable and native programs, as [documents/VISION.md](documents/VISION.md) says.
The libraries and parsers here are its first parts; the compiler, Runtime and SDK are designed in [documents/](documents/) and come later.

## Install and use

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

## Parts

| Part | What it is |
|---|---|
| `src/noldova.context.core` | The lowest library: foundational global identities with their standard behavior, utility types and base errors |
| `src/noldova.context.collections` | Collection algorithms, maps, sets, weak collections, readonly views and their iterators |
| `src/noldova.context.exceptions` | The additional exceptions, as [EXCEPTIONS-CONTRACT.md](documents/EXCEPTIONS-CONTRACT.md) says |
| `src/noldova.context.text` | Text abstractions, the accepted `String` additions and URI encoding |
| `src/noldova.context.json` | The JSON value types and `JsonReader`, which reads a JSON object's fields and says by path what is wrong |
| `src/noldova.context.testing` | context's own test framework, as [TESTING-CONTRACT.md](documents/TESTING-CONTRACT.md) says |
| `src/noldova.context.diagnostics` | Diagnostics, as [DIAGNOSTIC-CONTRACT.md](documents/DIAGNOSTIC-CONTRACT.md) says |
| `src/parsers/noldova.context.parsers` | The base every language parser builds on: sources, spans, a reader, and the lexer and parser classes |
| `src/parsers/noldova.context.parsers.regex` | The regular-expression parser, with its vendored conformance cases |
| `src/parsers/noldova.context.parsers.typescript` | The TypeScript parser, with its vendored conformance cases |
| `scripts/` | The build, test and release entry points, `npm run build`, `npm test` and `npm run release` |

## Checks

Every pull request into `main` must pass both checks before it merges.

No test code pauses for a fixed time.

| Check | What it verifies |
|---|---|
| Check / Linked issue | `.github/workflows/require-linked-issue.yml`, the "PR" workflow: the PR description has a standalone `Issue: #N`, `Issue #N` or closing reference, such as `Closes #N`, that names an issue in this repository. |
| Versions / Versions | The organization's shared settings, `.github`'s `versions.yml`, name the Node.js and npm versions and the runner that "Build and test" uses. |
| Linux x64 | The toolchain is the Node.js and npm versions the shared settings name, Node.js 24.21.0 with npm 11.19.0 today, on the runner they name; `.gitattributes` holds `* text=auto eol=lf`, and every tracked text file outside the vendored inputs, which their own `.gitattributes` marks `-text`, uses LF line endings and ends with exactly one newline; `npm run build` installs the locked third-party packages with `npm ci --ignore-scripts`, then builds, packs and installs every package, `npm test` runs the whole suite, and both leave every tracked file unchanged. |
| All targets | Every target's job passed, "Linux x64" today, and the shared settings named the versions; it reports even when a job before it failed or was skipped, so `main` can require it. |

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

## Build and test

The toolchain is Node.js 24.21.0 with npm 11.19.0, as `package.json` pins them.

```bash
npm run build
```

```bash
npm test
```

`npm run build` installs the two locked development packages, TypeScript and Node.js's type declarations, without running their install scripts; then it builds, packs and installs every CONTEXT package into `_build/` and `_packages/`.
`npm test` runs the whole suite, including the vendored conformance cases.
Two options shorten its output, as the CI run uses them:

```bash
npm test -- --skip-test-details --skip-coverage-details
```

- `--skip-test-details` hides the line of each passing test; failures, skipped tests and the totals still print.
- `--skip-coverage-details` hides the coverage rows of fully covered files; files with gaps and the overall row still print.

## Releases

The packages are published to npm under `@noldova` from `main` by the release workflow, `.github/workflows/release-npm.yml`, with provenance and without a stored token.
Their versions follow [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md).

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
