# noldova.context.exceptions

The exceptions CONTEXT libraries throw: an abstract `Exception` base that names
itself after its concrete class, argument exceptions with guards that check a
value and narrow its type in one call, and an index exception.

## Install

```bash
npm install @noldova/context.exceptions
```

## Use

```ts
import { ArgumentException, ArgumentNullException, Exception, ExceptionOptions } from "@noldova/context.exceptions";

class InputException extends Exception {
  public constructor(message: string, options?: ExceptionOptions) {
    super(message, options);
  }
}

function readName(values: Map<string, string>): string {
  const name = values.get("name");
  ArgumentException.throwIfNullOrWhitespace(name, "name");
  return name; // Narrowed to string by the guard.
}

readName(new Map([["name", "Fixture"]])); // "Fixture"
new ArgumentNullException("input").message; // "Value cannot be null or undefined. (Parameter 'input')"
new InputException("Cannot read input.", new ExceptionOptions(new Error("Bad encoding."))).name; // "InputException"
```

`ArgumentException`, `ArgumentNullException` and `ArgumentOutOfRangeException`
keep the parameter name as a field, and `ArgumentOutOfRangeException` also keeps
the rejected value. `IndexOutOfRangeException` carries a message and, where
given, a cause. The declaration file `api/index.d.ts` documents every member
with its contract and examples.

## License

MIT; see `LICENSE`.
