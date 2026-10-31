# noldova.context.exceptions

The exceptions CONTEXT libraries throw: an abstract `Exception` base that names
itself after its concrete class, and argument and index exceptions with guards
that check a value and narrow its type in one call.

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

new ArgumentNullException("input").message; // "Value cannot be null or undefined. (Parameter 'input')"
new InputException("Cannot read input.", new ExceptionOptions(new Error("Bad encoding."))).name; // "InputException"
```

`ArgumentException`, `ArgumentNullException`, `ArgumentOutOfRangeException`
and `IndexOutOfRangeException` keep the parameter name and, where given, the
rejected value as fields. The declaration file `api/index.d.ts` documents every
member with its contract and examples.

## License

MIT; see `LICENSE`.
