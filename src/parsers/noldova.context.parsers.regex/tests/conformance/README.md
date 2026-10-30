# Regex conformance

This directory holds the pinned Test262 cases for regular expressions and the
answers Test262 itself gives for every pattern they write. They are external
evidence, not CONTEXT implementation code; `TESTING-CONTRACT.md` section 7
owns the intake, how the answers are read, and the ledger.

`npm run vendor:regex -- <commit>` writes this intake: it lists Test262's
regular-expression roots at that commit, downloads every file and checks it
against the git blob hash the pinned tree names, replaces `cases/` and
`licenses/`, records the commit, roots, and file counts in `PROVENANCE.json`,
and reads the expected patterns again. `CERTIFICATION.md` records the run that
reproduced the intake byte-identically, and `.gitattributes` preserves
upstream bytes.

`cases/` holds the upstream test files as they are, under their Test262 paths
without the leading `test/`: `annexB/built-ins/RegExp`, `built-ins/RegExp`,
and `language/literals/regexp`. `licenses/` holds Test262's license.

`expected/` is what Test262 expects of every pattern its cases write, read from
the cases with the pinned TypeScript's syntax tree and nothing executed:
`patterns.jsonl` holds one record per case in path order, the patterns that
must be accepted and the groups of which one must be refused, or the reason
the case is inapplicable, and `MANIFEST.json` names the TypeScript version, the
reading rules' version, the accounting, and the records' hash. The package
build reads the cases again and fails when `expected/` differs from what they
give.

`known-failures.json` is the committed ledger of applicable cases the parser
does not yet match, each with the patterns it refuses that Test262 accepts and
the groups it accepts that Test262 refuses, with its totals and the hash of the
expected patterns it was measured against; `statedDifferences` names the cases
whose difference is the accepted Unicode profile. The runner,
`conformance-cases.test.ts`, registers one test per applicable case: a case
fails when it leaves Test262's answer, a known failure fails when its
difference is not the recorded one or when it now matches, so the ledger
shrinks until the expected patterns change. `npm run
generate:regex-known-failures` rewrites it from a complete comparison. Run the
runner alone with `npm run test -- category:RegexConformance`.
