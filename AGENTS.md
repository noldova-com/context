# Agent instructions

Noldova owns this repository and makes the final decisions.

## Documents

Read the owner before you work on its subject, and change a rule there.

| When you… | Read |
|---|---|
| need what each part is for, or how to build and test it | [README.md](README.md) |
| write code, tests, documents or commits | [documents/ARCHITECTURE.md](documents/ARCHITECTURE.md), the code rules of this repository |
| need the organization's rules for code, tests, documents, Git and security | [Noldova's standards](https://github.com/noldova-com/.github/blob/main/standards/AGENTS.md) |
| need why CONTEXT exists | [documents/VISION.md](documents/VISION.md) |
| work on compiler phases, semantics, IR or AOT | [documents/COMPILER-ARCHITECTURE.md](documents/COMPILER-ARCHITECTURE.md) |
| change the TypeScript toolchain pins, the strict repository profile or the conformance corpus | [documents/TYPESCRIPT-COMPATIBILITY.md](documents/TYPESCRIPT-COMPATIBILITY.md) |
| change the accepted source or a compatibility setting | [documents/LANGUAGE-SURFACE.md](documents/LANGUAGE-SURFACE.md) |
| produce, collect or compare diagnostics | [documents/DIAGNOSTIC-CONTRACT.md](documents/DIAGNOSTIC-CONTRACT.md) |
| add or throw an exception | [documents/EXCEPTIONS-CONTRACT.md](documents/EXCEPTIONS-CONTRACT.md) |
| change the build, packing, installation or verification gates | [documents/BUILD-AND-VERIFICATION.md](documents/BUILD-AND-VERIFICATION.md) |
| change test discovery, execution, assertions or coverage in `noldova.context.testing` | [documents/TESTING-CONTRACT.md](documents/TESTING-CONTRACT.md) |
| change packages, projects or dependency resolution | [documents/PACKAGE-CONTRACT.md](documents/PACKAGE-CONTRACT.md) |
| change framework references or global exposure | [documents/FRAMEWORK-CONTRACT.md](documents/FRAMEWORK-CONTRACT.md) |
| decide which library owns something | [documents/LIBRARY-TOPOLOGY.md](documents/LIBRARY-TOPOLOGY.md) |
| change portable artifacts or debug sidecars | [documents/ARTIFACT-CONTRACT.md](documents/ARTIFACT-CONTRACT.md) |
| change the Runtime or the SDK | [documents/RUNTIME-AND-SDK.md](documents/RUNTIME-AND-SDK.md) |
| change values, conversions or boxing | [documents/VALUE-SEMANTICS.md](documents/VALUE-SEMANTICS.md) |
| change a version or how compatibility evolves | [documents/VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md) |

## Work

- Every pull request names the issue it resolves in this repository, such as `Closes #N`, and passes the checks [README.md](README.md) lists.
- Vendored inputs, such as TypeScript's and Test262's cases, their licenses and their provenance stay unchanged; they are evidence, not production code ([TYPESCRIPT-COMPATIBILITY.md](documents/TYPESCRIPT-COMPATIBILITY.md), [TESTING-CONTRACT.md](documents/TESTING-CONTRACT.md)).
  Adapted conformance tests follow the accounting in [TESTING-CONTRACT.md](documents/TESTING-CONTRACT.md).
- Product and package versions, and internal format versions, follow [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md).
