# CONTEXT exceptions contract

**Scope:** Exception model, ownership, throw guards, message resources, and throwing discipline

Exceptions are internal failure signals.
A modeled, user-facing operation failure is a diagnostic under `DIAGNOSTIC-CONTRACT.md`; neither is converted into the other merely to keep execution moving.

## 1. Ownership

`noldova.context.exceptions` owns the abstract `Exception` base and the general-purpose concrete exceptions.
A package that defines domain-specific exceptions owns them and defines one package exception base extending `Exception`; every exception it owns inherits from that base, directly or indirectly.
General-purpose exceptions consumed from another package retain their original hierarchy.
There is no central exception registry, code registry, or message-string package.

Within every package, exception classes live in the `exceptions/` directory of the production sources, and their tests mirror that path.

## 2. Model

`Exception` is an abstract class extending the host `Error`.
The base is abstract so that it is never thrown directly: every CONTEXT throw is a named concrete type.

- `name` comes from the class: the base sets it to the concrete class's name (`new.target.name`), and CONTEXT keeps class names as metadata, so nothing renames them.
- `message` is required by the base; concrete classes default it from their package's `Resources`.
- `ExceptionOptions` is a concrete class implementing the host `ErrorOptions` contract.
  Its readonly `cause` is the inner-exception analogue; no parallel accessor exists.
- `stack` is host-provided.

Exceptions carry no numeric code.
Identity is the type, caught with `instanceof`.
Numeric failure codes wait for a Runtime failure-reporting contract that demonstrates a consumer; adding a field then is additive. Exceptions carry no free-form data bag, source name or serialization surface.

## 3. Concrete exceptions

There is no vague universal tier that splits system failures from application failures.
A package exception base is the meaningful runtime catch boundary for failures owned by that package; it may remain concrete when it also represents the package's general failure condition.
Concrete exceptions specialize that base or another concrete exception only for a demonstrated condition, as `ArgumentNullException` extends `ArgumentException`.
Types are added only for a present need, where a real condition needs a name.
Class names use the `Exception` suffix, and a concrete exception carries the meaningful data of its condition as readonly fields, such as `parameterName` on `ArgumentException` with the `(Parameter 'name')` message suffix.

`NullReferenceException` is deliberately not adopted: the host `TypeError` owns null dereference.

## 4. Throw guards

A recurring guard condition becomes a static `throwIf...` method on the exception type that owns the condition, never a helper bucket.
Guards use TypeScript `asserts` signatures when they establish an expressible type refinement; otherwise they return `void`.
`parameterName` is an explicit parameter, because TypeScript cannot capture the caller's argument expression.
A condition thrown at exactly one site throws directly and graduates to a guard when a second site appears.

Intentional divergence: the string guards throw `ArgumentException` for every failing input, including `null` and `undefined`, so the parent class does not depend on its own subclass.

## 5. Messages and throwing discipline

Exception text uses the package's canonical English `Resources`, one per package, and is never inline, exported, or centralized across packages.
Localization is deferred.

Core-owned ECMAScript Error identities remain available to Core APIs without a dependency on this package; such an API throws the exact Core Error subtype its contract declares.
Other repository code throws CONTEXT exceptions for its own failures; host built-in errors arise only from the platform itself.
Guards validate untrusted input at the owning boundary.
