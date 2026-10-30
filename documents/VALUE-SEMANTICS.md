# CONTEXT value semantics

**Scope:** Observable TypeScript and ECMAScript value behavior and representation boundaries

This document defines the value behavior that CONTEXT must preserve.
It does not select an object layout, tagged-value encoding, boxing format, garbage collector, instruction set, metadata schema, or ABI.

## 1. Semantic authority

For the pinned TypeScript target and supported source profiles defined by `LANGUAGE-SURFACE.md`, TypeScript and ECMAScript define observable value behavior.

An optimization or runtime representation is valid only when every supported program observes the same result required by the accepted TypeScript version and applicable ECMAScript operation.

## 2. Semantic type and physical representation

A source-level type and its physical representation are different facts.
Semantic analysis determines what a value means.
A later representation owner determines how that particular value, storage location, or boundary is carried.

The implementation may use raw scalars, managed references, inline values, internal boxes, or another proven representation.
None of those mechanisms may silently change source-level type, equality, coercion, identity, truthiness, `typeof`, property behavior, or default-value behavior.

Physical representation follows proved value flow and boundary requirements, not a guessed type, syntax annotation alone, missing information, or backend convenience.

## 3. Core value distinctions

The following remain distinct whenever the language distinguishes them:

- no compiler fact or missing storage entry;
- an unresolved or unsupported compiler state;
- `undefined`;
- `null`;
- numeric positive or negative zero;
- `false`;
- the empty string; and
- a missing property, array hole, or failed lookup.

No sentinel value may represent two observable values merely because their current machine bits happen to match.
Missing compiler knowledge is never a runtime value.

TypeScript `number` has JavaScript numeric semantics, including `NaN`, positive and negative zero, infinities, and the required conversions.
An implementation may use a narrower or specialized internal representation only when the specialization is observationally equivalent and every transition is proved.

JavaScript string behavior follows ECMAScript.
Boolean is not an integer type, even if an internal representation can encode it numerically.
`bigint` and `symbol` are required language concepts under the complete target; their exact runtime representations require explicit accepted decisions, but they cannot be excluded, collapsed into another primitive, or implemented through a fallback.
Any primitive introduced by a later compatibility-reference version requires a reviewed language and runtime decision as part of that upgrade.

## 4. `any`, `unknown`, and `object`

`any`, `unknown`, and `object` are different semantic concepts.
They are not aliases for each other or for a universal base object type.

- `any` bypasses static assignability checking where TypeScript permits it.
  An assignment from `any` does not implicitly validate, coerce, or change the runtime value.
- `unknown` requires a supported narrowing before an operation that depends on a more specific type.
- `object` represents the TypeScript object domain and does not automatically admit primitive values.

A destination annotation cannot erase the runtime provenance of a value.
For example, assigning an `any` value containing a string to a location annotated as `number` does not convert the string into a number merely because the assignment is statically permitted.

## 5. Assertions and narrowing

A TypeScript type assertion is erased.
`value as T` does not perform a runtime check, conversion, box, unbox, allocation, or throw merely because the asserted type is `T`.

Any internal representation transition associated with an asserted expression requires independent proof of the runtime kind.
Without that proof, the representation remains capable of preserving the original value until a real language operation performs a required conversion.

Control-flow narrowing changes what the compiler knows at a particular use.
It does not retroactively change the stored runtime value.

## 6. Equality and identity

CONTEXT keeps the applicable ECMAScript equality operations separate:

| Consumer | Semantic operation |
|---|---|
| `===` and `!==` | IsStrictlyEqual |
| `==` and `!=` | IsLooselyEqual |
| `Object.is` | SameValue |
| Map and Set keys | SameValueZero |

The implementation must preserve each operation's rules for `NaN`, signed zero, strings, references, `null`, and `undefined`.

Reference objects use observable object identity where ECMAScript requires it.
Primitive values use primitive semantics.
An internal box used to carry a primitive is not an observable JavaScript wrapper object and must not create a new primitive identity, satisfy `instanceof`, or compare by its internal pointer.

If explicit JavaScript wrapper objects such as `new Number(...)` are supported, they remain real objects and are distinct from internal representation boxes.

## 7. `typeof`, truthiness, conversions, and properties

`typeof`, truthiness, arithmetic, relational comparison, concatenation, bitwise operations, property access, and `instanceof` follow their applicable ECMAScript rules.

In particular:

- `undefined`, `null`, `false`, numeric zero, negative zero, `NaN`, and the empty string are falsy; objects are truthy;
- a conversion occurs only where the language operation requires it, not on an ordinary assignment or assertion;
- primitive property behavior may use an internal mechanism, but that mechanism does not expose an internal box as the primitive's identity; and
- `instanceof` observes the supported constructor/prototype and object-identity rules, not an internal carrying representation.

Compile-time folding is permitted only when it produces exactly the same result as the runtime operation for every value reaching that expression.

## 8. Defaults, holes, and failed lookup

Every default-producing site has explicit language semantics.
Uninitialized or omitted values, missing arguments, omitted returns, `void`, optional-chain misses, failed lookups, absent properties, and array holes must not be collapsed into numeric zero, `false`, `null`, or missing compiler state.

An array hole and an explicit `undefined` element may produce the same value for some reads while remaining observably different for operations that inspect property presence or enumeration.
Standard-library collections must preserve the equality, presence, ordering, and missing-value rules of the source-language contract they claim to implement.

## 9. Boundaries and erased values

Value semantics must survive every boundary, including:

- local initialization and assignment;
- arguments, optional and rest parameters, and returns;
- direct, virtual, interface, closure, dynamic, imported, and exported calls;
- instance and static fields, properties, records, and object literals;
- captures and asynchronous or generator state;
- arrays, maps, sets, lists, generics, unions, and joins; and
- package and runtime boundaries.

An implementation cannot prove correctness only inside one package or one compilation and assume cross-package behavior follows.
Open or erased boundaries retain enough runtime information to preserve every supported value that may legally cross them.

## 10. By-reference-only values

A CONTEXT value that represents a managed address, span-like reference, or other by-reference-only lifetime cannot become an ordinary JavaScript object or erased value.
It cannot be boxed into `any`, `unknown`, or `object`, stored in an ordinary heap field or collection, captured beyond its valid lifetime, or sent through an unconstrained package boundary.

Such an escape fails with a specific diagnostic before emission.
A future by-reference feature must define its exact lifetime and boundary rules before it is added to the supported language surface.

## 11. Verification requirements

Value-semantic claims require executable differential cases against the accepted TypeScript/ECMAScript behavior where that behavior is the oracle.
Tests cover relevant values, flows, consumers, defaults, package boundaries, and supported runtime targets.

Structural representation tests may additionally prove layouts, descriptors, transitions, GC classifications, or ABI fields.
They do not replace observable behavior tests.

## 12. Primary references

- [ECMAScript IsStrictlyEqual][J1]
- [ECMAScript IsLooselyEqual][J2]
- [ECMAScript SameValue][J3]
- [ECMAScript SameValueZero][J4]
- [ECMAScript ToBoolean][J5]
- [ECMAScript `typeof`][J6]
- [TypeScript type assertions][T1]

[J1]: https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal
[J2]: https://tc39.es/ecma262/multipage/abstract-operations.html#sec-islooselyequal
[J3]: https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue
[J4]: https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero
[J5]: https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toboolean
[J6]: https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-typeof-operator
[T1]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
