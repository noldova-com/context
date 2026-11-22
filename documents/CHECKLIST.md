# CONTEXT review checklist

Code written or reviewed in this repository is read against this list.
Each item names a subject and links the document that owns its rule; the rule's wording lives there, and this list changes only when an item is added or removed.

## 1. Purpose

- [ ] The package does what its row in [LIBRARY-TOPOLOGY.md](LIBRARY-TOPOLOGY.md) says, nothing more, and its dependencies follow section 4 there.
- [ ] Behavior lives with its owner: [ARCHITECTURE.md](ARCHITECTURE.md) sections 1, 3 and 4.

## 2. Public API

- [ ] Each type is complete for its concept, API beyond that has a caller, and no existing API is removed: [ARCHITECTURE.md](ARCHITECTURE.md) section 3.
- [ ] `src/api/index.d.ts` declares what external consumers should see, and documents each member it declares: [ARCHITECTURE.md](ARCHITECTURE.md) section 8.
- [ ] Names: [CODE.md](https://github.com/noldova-com/.github/blob/main/standards/CODE.md) and [stacks/TYPESCRIPT.md](https://github.com/noldova-com/.github/blob/main/standards/stacks/TYPESCRIPT.md).

## 3. Code

- [ ] Small, simple, like the code around it, with named classes for structured values: [CODE.md](https://github.com/noldova-com/.github/blob/main/standards/CODE.md).
- [ ] Types, casts, guards, member order and `Resources`: [stacks/TYPESCRIPT.md](https://github.com/noldova-com/.github/blob/main/standards/stacks/TYPESCRIPT.md).
- [ ] Extension methods, values and text, comments: [ARCHITECTURE.md](ARCHITECTURE.md) sections 4, 7 and 8.
- [ ] Failures: [EXCEPTIONS-CONTRACT.md](EXCEPTIONS-CONTRACT.md).
- [ ] No test-only seams: [TESTING.md](https://github.com/noldova-com/.github/blob/main/standards/TESTING.md#tests-and-production-code).

## 4. Built to last: Node now, CONTEXT's own stack later

- [ ] Host modules only where [LIBRARY-TOPOLOGY.md](LIBRARY-TOPOLOGY.md) section 7.1 and [TESTING-CONTRACT.md](TESTING-CONTRACT.md) section 1 allow them, with the Node note on each file that section 1 requires it on.
- [ ] Outside those host boundaries, only ECMAScript-standard behavior: nothing that holds only on V8 or Node.
- [ ] No third-party package: [LIBRARY-TOPOLOGY.md](LIBRARY-TOPOLOGY.md) section 7.1.
- [ ] Values keep the meanings [VALUE-SEMANTICS.md](VALUE-SEMANTICS.md) gives them.

## 5. Built for speed

- [ ] Hot paths allocate nothing they don't need: no closure, array, spread, iterator or string built per item or call where a loop or a reused value does the same.
- [ ] No hidden quadratic work, such as a search, `shift`, `splice` or string concatenation inside a loop over the input.
- [ ] Objects keep one shape: every field is set in the constructor, and nothing is added or deleted later.
- [ ] Input of unbounded size never sets the recursion depth; any limit that remains is documented and tested.
- [ ] A performance claim has a measurement behind it: [BUILD-AND-VERIFICATION.md](BUILD-AND-VERIFICATION.md) section 6.

## 6. Tests

- [ ] Every behavior and failure path has a test that fails without it, with full coverage and no wait on time: [TESTING.md](https://github.com/noldova-com/.github/blob/main/standards/TESTING.md) and [TESTING-CONTRACT.md](TESTING-CONTRACT.md).

## 7. Documents

- [ ] What the README and `index.d.ts` say is true at the code's head: [DOCUMENTS.md](https://github.com/noldova-com/.github/blob/main/standards/DOCUMENTS.md).
