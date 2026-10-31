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
```

The predicates classify primitives only: `Object.isString(new String(""))` is
`false`. The declaration file `api/index.d.ts` documents every member with its
contract and examples.

## License

MIT; see `LICENSE`.
