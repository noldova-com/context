# noldova.context.core

The lowest CONTEXT library: `nameof`, which returns a member name checked
against a type during compilation, and predicates and helpers added to the
global `Object` and `String` constructors. Importing the package installs the
additions; every other CONTEXT package builds on them.

## Install

```bash
npm install @noldova/context.core
```

## Use

```ts
import { nameof } from "@noldova/context.core";

class Options {
  public timeout: number = 0;
}

nameof<Options>("timeout"); // "timeout"; another name does not compile.
nameof<Options>(t => t.timeout); // "timeout"

Object.isNullOrUndefined(0); // false: zero is a value.
Object.isString(""); // true
String.format("Expected {0} of {1}", 3, 5); // "Expected 3 of 5"
String.isNullOrWhitespace(" \t\r\n "); // true
String.join(", ", ["a", "b", "c"]); // "a, b, c"
```

The predicates classify primitives only: `Object.isString(new String(""))` is
`false`. `Object.isObject` accepts every non-null object, functions included,
while `Object.isPlainObject` accepts only object literals, such as the records
`JSON.parse` returns, and objects made with `Object.create(null)`. The
declaration file `api/index.d.ts` documents every member with its contract and
examples.

## One copy

An app loads one copy of the package, since the additions can be installed only
once. The CONTEXT packages take it as a peer in a range, so npm installs one
copy for packages that need different versions in that range. A second copy that loads anyway, such as
one npm nests under a package that pins another version, refuses to load with
an `Error` saying two copies are loaded; `npm ls @noldova/context.core` shows
which packages bring each. The error names no folder, since a module's own
location is host plumbing outside the ECMAScript library the package compiles
against.

## License

MIT; see `LICENSE`.
