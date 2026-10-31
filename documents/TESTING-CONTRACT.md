# CONTEXT testing contract

**Scope:** Test framework ownership, discovery, execution, assertions, results, skips, coverage measurement, internal access, and self-verification

Noldova's [testing standard](https://github.com/noldova-com/.github/blob/main/standards/TESTING.md) and its [TypeScript standard](https://github.com/noldova-com/.github/blob/main/standards/stacks/TYPESCRIPT.md) own test placement, naming, mirroring, and the complete-coverage requirement; `ARCHITECTURE.md` adds context's test class names.
`BUILD-AND-VERIFICATION.md` owns when and against what the suite runs.

## 1. Ownership

`noldova.context.testing` owns the test model, discovery, execution, assertion vocabulary, result reporting, and coverage enforcement.
It is repository verification tooling: no Runtime distribution includes it, and SDK inclusion is a separate composition decision.
It consumes the Core global surface, Text-owned line terminators, and the Exceptions base through ordinary dependencies and never reimplements library behavior locally.

Node, npm, TypeScript-emitted JavaScript and source maps, and V8 are temporary bootstrap providers; they do not define the Testing architecture.
The durable contract is the authoring model, assertion behavior, test and data-row identity, categories, skips, deterministic selection and execution, result accounting, reporting semantics, and the complete-coverage gate.
When the CONTEXT compiler, Runtime, and SDK own filesystem discovery, module loading, descriptor inspection, process handling, console output, rejection attribution, timers, and coverage intake, their providers replace the host surface; Node APIs, V8 formats, and generated-JavaScript assumptions are not preserved.
A temporary provider does not relax coding standards or justify a public API added only for that provider.
Only files known to need changes when Node is replaced carry a short, plain-language comment below the license, such as: "This file uses Node APIs and will change when we replace Node." Do not mark portable code merely because it currently runs on Node or might change in a future redesign.

## 2. Discovery

The build supplies each canonical package identity and compiled test root explicitly.
Discovery identifies tests by filename and Testing-owned decorators, never by path inference or a special project kind.
File, class, and method naming follows the organization's TypeScript standard and `ARCHITECTURE.md`:

- a test class is exported and marked `@TestClass`;
- a test method is a public instance method marked `@TestMethod`; a static method carrying the mark fails discovery;
- `@TestData` rows are discovered as independent tests in written order, each a non-empty inline row whose value count matches the method's fixed runtime arity; and
- `@Category` names on a class and its methods combine, collapsing duplicates while preserving written order.

The decorators mark their targets through symbol properties readable at discovery time; they perform no registration and consult no registry.
A general-purpose attribute or reflection mechanism is a separate future decision.
Future Runtime-hosted discovery consumes ordinary library artifacts and their metadata; a test library is never made an executable.

Discovery is deterministic: files, classes, and methods in lexicographic UTF-16 code-unit order, independent of host locale; rows in decorator order.
Every discovered file, class, method, and row is accounted in the results.
A test file yielding no marked class, an exported `*Tests` class without `@TestClass`, a marked class or method violating the naming convention, a malformed data row or category, and a corrupt mark are failures, not silent no-ops.
Inline values are the only current data source, apart from the rows each conformance runner applies at module load from its committed expected answers, one per applicable case, as section 7 requires.
Class and method marks must be own data properties containing `true`.
Symbol-named and generator test methods are unsupported and fail discovery; they are never silently skipped or reported as executed.

`@TestData` is valid only on an instance method also marked with `@TestMethod`; methods declaring runtime parameters without data fail discovery.
Default and rest forms that do not expose a fixed runtime arity are not data-test inputs.
`@Category` is valid only on a class marked with `@TestClass` or an instance method marked with `@TestMethod`; empty, whitespace, static, unmarked, and corrupt uses fail discovery.
Using either decorator outside its permitted targets fails discovery.

## 3. Execution

Each method or data row runs on a fresh instance of its test class; no state flows between tests.
Synchronous and asynchronous methods are supported: a returned promise is awaited, and a rejection, thrown exception, or unhandled rejection attributable to the test is a failure.
Work that never settles fails loudly; a hang is never success or silence.
The runner owns the timeout mechanism and reports it with the failure; later unhandled rejections remain attributed to their originating test.
The command-line run isolates tests in parallel worker threads, one per available processor and at least two by default, that its main thread times per test: the workers take whole test classes from one shared queue, and the run reports each class in discovery order, whichever worker finishes it first.
Its summary's time is the run's elapsed time, not the sum of its tests' durations.
A test that overruns its timeout, whether it never settles or runs synchronous code that never ends, stops its worker: the worker reports the timeout and starts no further test, and the main thread ends a worker that does not report in time.
A worker reports each test file it imports, and its start limit bounds each file's import rather than all of them, so a slow machine fails the run only when one file's import outlasts the limit; the failure names the last file the worker imported, if it imported one.
A fresh worker resumes after that test and keeps every result already reported; a test its main thread had to stop is recorded as timed out without running again, so no test runs twice or in two workers at once, abandoned work never outlives its test, and the run continues.
When no class is left, the main thread tells each worker, which closes its port so its thread ends by itself and writes its coverage; a worker that fails or ends with an exit code other than 0 meanwhile, or has not ended within five seconds, fails the run, since its coverage would be incomplete.
Each run makes one temporary folder and points `TMPDIR`, `TEMP` and `TMP` at it, so its workers' temporary files go there; anything a test leaves there fails the run, and the run removes the folder at the end.
A test class that leaves a timer, handle or request open in its worker fails the run, naming the class and what it left.
An app runs tests in parallel workers the same way through the exported `ParallelTestRunner`, which returns the result objects `TestRunner` returns: test data, assertion values and thrown values that cannot cross between threads arrive as values that print as the originals did, and an error other than an `AssertFailedException` or a `TestTimeoutException` arrives as an `Error` with the original's name, message and stack.
It never calls a listener's `onMethodStarted`, because only its workers load the test modules, and it leaves the process's environment, temporary folder included, to the app.

Execution order is deterministic: method-name order, then row order.
Correctness must not depend on order.
Targeted selection of packages, files, classes, methods, or indexed rows serves investigation: any number of filter substrings combine with OR semantics, and `category:name` selects an exact category.
A filtered run's summary names its filters and its discovered, selected and unselected counts.
A run that selects no test fails; when its filters selected nothing, it says so.
Categories never control order or concurrency.
A targeted run never represents the complete gate.

The runner performs no product bootstrap: it initializes no Runtime, loads no arbitrary product packages, and installs no environment shims.
A test needing an environment builds it through precisely named fixtures owned by its project.

## 4. Assertions

`Assert` is a class-first vocabulary with exact-value semantics (`areEqual` uses SameValue, never truthiness) and TypeScript `asserts` narrowing where applicable.
A failure throws `AssertFailedException`, extending the package's `TestingException` base, carrying the expected value, the actual value, and the optional message.
Additions require a present need.

## 5. Results, reporting, and skips

The run produces a structured, immutable result model with concrete classes: executed, passed, failed, and skipped tests, each with full identity and failure or skip detail, and per-row index, arguments, duration, timeout, and outcome.
Totals reconcile exactly with discovery.
Presentation is separate: console layout and color belong to the reporting boundary, a machine consumer never parses human-readable output, and reduced-detail modes may hide passing tests or fully covered files while failures, skips, incomplete coverage, and totals are always presented.

A skip is declared in source through `@Skip` with a required reason and is reported individually; class- and method-level skips apply to every row.
An unreasoned or silent skip fails the run.
External skip lists and runner-embedded exclusions are prohibited.
A skip mark requires its corresponding `@TestClass` or `@TestMethod` mark; discovery rejects an orphaned mark rather than discarding it.

## 6. Coverage

Coverage is measured through the pinned Node runtime's V8 facility and enforced by this package against the complete inventory of installed production files, never only the files a run happened to load: a file no test loads counts as fully uncovered unless it contains no executable code, a position no report claims counts as uncovered, and a malformed coverage report or source map fails the analysis rather than degrading it.
Source maps must be valid flat Source Map v3 documents within the subset the pinned TypeScript bootstrap emits; only a mapped segment on the same generated line supplies an original position.
Non-executable files appear in the inventory as not applicable without entering counts.
A skip that removes the sole coverage of production code fails the gate.
Exclusions are explicit, justified, and reported.
A catch that handles one exception type rethrows every other, and that rethrow is reached with a failing test double: the only accepted broken double, which proves nothing beyond propagation, since a failing collaborator is not supported input.
The coverage command supplies each project's canonical identity, installed production directory, and source directory explicitly; results carry that identity and a project-relative path.
A CONTEXT-owned coverage mechanism for self-hosted execution requires its own decision.

After range validation, non-empty V8 ranges containing only whitespace do not override enclosing coverage or count as executable blocks.
This prevents control-flow spacing from becoming a phantom branch; it does not grant coverage to positions without an enclosing report.

## 7. External conformance accounting

An imported conformance scope keeps one machine-readable record of every upstream case: exact pin, source hash, applicability, and the obligation the package answers for it.
Its summary is verified against the records, and every applicable case runs as exactly one test.
Classification follows observable obligations, not whole-file convenience: a test combining accepted syntax with deferred Runtime behavior keeps its syntax obligation applicable and executable.
Passing cases does not establish complete conformance while any applicable obligation remains deferred, unaccounted, or profile-incompatible.
Every report states completeness explicitly.
Closure means the applicable obligations in the named, pinned suite are accounted for and passing; it proves neither the complete grammar nor the Runtime.
A new counterexample requires a regression test and a repair, not a broader interpretation of a passing suite; the one exception is a counterexample to the legality diagnostics syntax hosts, which `DIAGNOSTIC-CONTRACT.md` section 7 leaves to semantic analysis.

Every imported suite has one shape, in the test project of the package it measures, under `tests/conformance/`: `cases/` holds the upstream files as they are, `licenses/` their licenses, `expected/` the answer for every case with a `MANIFEST.json` naming what produced it and sealing it by hash, `known-failures.json` the ledger of applicable cases the package does not yet match, and `PROVENANCE.json` the pinned upstream, its roots, and its counts, beside a README, a `.gitattributes` preserving upstream bytes, and a `CERTIFICATION.md` recording the run that reproduced the intake.
A suite adds only what its answers need, as TypeScript adds its baselines, diagnostic definitions, and libraries.
One command per suite, `npm run vendor:<suite> -- <version>`, replaces the intake and its answers, and `npm run generate:<suite>-known-failures` rewrites the ledger, which under unchanged answers only shrinks.
One runner test class registers one test per applicable case and fails on a new difference and on a known failure that now matches.

The Regex package's suite is Test262's regular-expression roots, `built-ins/RegExp`, `language/literals/regexp`, and `annexB/built-ins/RegExp`, at a pinned commit, and its answers are Test262's own, read from the cases with the pinned TypeScript's syntax tree and nothing executed.
A literal must be refused where its file is marked `negative: phase: parse` and accepted in any other file.
A `RegExp` call or construction written with string arguments must be refused inside `assert.throws(SyntaxError, ...)` or a `try` whose `catch` checks for `SyntaxError`, one refusal satisfying such a group, and accepted elsewhere.
A pattern built at run time, and a call in a `try` that expects no `SyntaxError`, is left to run time, and a case that fails to parse at a literal's boundary is the TypeScript parser's, which reads that boundary.
The ledger states as a difference the cases that name Unicode scripts newer than the accepted Unicode 15.1 profile.

Parser tests include independently established valid and invalid counterparts at grammar boundaries; expectations derived from the parser under test cannot establish conformance.
Differential tests record the reference implementation and its profile, comparing shared-profile inputs and testing version-sensitive inputs against explicit pinned-profile expectations, never treating a newer host as the authority.
An optimization preserves regression cases and is compared against a simple reference over systematically varied inputs; scaling is verified separately from correctness without machine-dependent timing thresholds.

## 8. Internal access

A test project may use package-internal modules and extensions when the owning project grants `internalsVisibleTo` under `PACKAGE-CONTRACT.md`.
Prefer the public API; direct internal access requires a genuinely internal behavior to verify.

During the Node bootstrap, the test project supplies the types for its internal imports and extension calls in one `internals.d.ts` beside its `.ctxp`.
It is a script with no top-level import or export: top-level `declare module` blocks describe the internal modules with their imports inside, and an augmentation of an existing module nests inside the internal module declaration whose implementation loads those extensions.
Create the file only when needed, declare only what the tests use, and keep each declaration faithful to its accessible contract.
These handwritten declarations are updated with their implementations; TypeScript checks test calls against them without verifying agreement with the installed JavaScript, and they are neither packed nor a reason to generate internal declarations or change the build, runner, manifests, or module resolution.
The `.ctxp` grant records permission and the declarations supply typing; neither enforces runtime access during the bootstrap.

## 9. Self-verification

The framework proves that failure actually fails.
Its own test project includes negative meta-fixtures (deliberately failing, throwing, rejecting, hanging, and skipping tests) that the runner must detect and report with exactly the expected classifications.
A change that can no longer witness one of these classes fails verification.
