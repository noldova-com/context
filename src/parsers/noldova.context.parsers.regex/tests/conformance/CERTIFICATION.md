# Regex conformance intake certification

**Scope:** Verification evidence that the vendored Test262 intake matches its
pinned upstream source and that the expected patterns are reproducible from it

This record certifies the intake described by `PROVENANCE.json`. It is
verification evidence, not a contract. A new Test262 pin replaces this
certification together with the intake it describes.

## 1. Method

Performed 2026-09-28. The intake was first written from a separate download
of the same pinned tree: every file of the three roots and the license was
fetched from GitHub's raw-content service at commit
`d86b2294eb0a17eaa281ff12c73c473ec864c72f` and checked against the git blob
hash the pinned tree names for it, and the expected patterns were read from
it. `npm run vendor:regex -- d86b2294eb0a17eaa281ff12c73c473ec864c72f` was
then run twice. Each run lists the pinned tree through the GitHub API,
downloads every file again, verifies its git blob hash, replaces `cases/` and
`licenses/`, writes `PROVENANCE.json`, and reads the expected patterns again
with the pinned TypeScript 7.0.2. After each run, every file under `cases/`,
`licenses/`, and `expected/` was compared by SHA-256 over sorted relative
paths with the intake before it, and `PROVENANCE.json` was compared byte for
byte.

The trust base is the git object hashes of the pinned Test262 commit, which
the GitHub trees API names and every downloaded file reproduces.

## 2. Results

| Local root | Files | Verdict |
|---|---:|---|
| `cases/annexB/built-ins/RegExp` | 62 | Byte-identical |
| `cases/built-ins/RegExp` | 1,879 | Byte-identical |
| `cases/language/literals/regexp` | 238 | Byte-identical |
| `licenses/` | 1 | Byte-identical |
| `expected/` | 2 | Byte-identical |
| `PROVENANCE.json` | 1 | Byte-identical |

The sorted SHA-256 listing of the 2,179 case files hashes to
`ea0273594d2bd9d0b4cd833cd1d336ba97c95e8a7fc8ca65d3b11bb165a3f388`;
`expected/patterns.jsonl` hashes to
`1ae79526ce1d7310bc3ddf3ec3d89749f03eabff52cf91a2ad9c056fde7cf2d7`, the
value `expected/MANIFEST.json` seals, and `licenses/LICENSE` to
`4dd9244dfe8197c75348c4b24ab53d29d3b1cfad143ac76b5a3d8942aa354ce0`.

## 3. Claim

The intake is the complete declared selection of the pinned commit,
unchanged, and the expected patterns are reproducible from it under the
reading rules `TESTING-CONTRACT.md` section 7 owns. This does not show that
those rules read every Test262 expectation a test states, only the ones they
name; the patterns a case builds at run time are outside them.
