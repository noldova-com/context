# noldova.context.threading

Cancellation for any operation: a `CancellationTokenSource` cancels, and the
`CancellationToken` it hands out tells an operation whether to stop. An
operation that takes a token can stop when asked, but can't cancel others that
share it.

## Install

```bash
npm install @noldova/context.threading
```

## Use

```ts
import { CancellationToken, CancellationTokenSource, OperationCanceledException } from "@noldova/context.threading";

function sum(values: readonly number[], token: CancellationToken): number {
  let sum = 0;
  for (const value of values) {
    token.throwIfCancellationRequested();
    sum += value;
  }

  return sum;
}

using source = new CancellationTokenSource();
source.token.register(() => console.log("canceled"));
source.cancel(); // logs "canceled"

try {
  sum([1, 2, 3], source.token);
}
catch (exception) {
  exception instanceof OperationCanceledException; // true
}
```

`cancelAfter(milliseconds)` cancels the source once the delay passes; a later
call replaces the pending delay, and `cancel` or disposing the source clears it:

```ts
using timed = new CancellationTokenSource();
timed.cancelAfter(5000);
```

`CancellationToken.none` is never canceled, for a call without cancellation.
`CancellationTokenSource.createLinkedTokenSource(...tokens)` is canceled when any
of its tokens is; dispose it to stop watching them.

Callbacks run the last registered first, so cleanup unwinds in reverse. `cancel`
runs every one, and when any throws, it then throws
`CancellationCallbacksFailedException` with every error. A callback taken back
by one that ran before it doesn't run. A callback registered after the
cancellation runs at once.

A host API that takes an `AbortSignal` gets one from a token in one line:

```ts
const controller = new AbortController();
source.token.register(() => controller.abort());
```

## API

| Type | What it is |
|---|---|
| `CancellationTokenSource` | Cancels its token; `cancel`, `cancelAfter`, `isCancellationRequested`, `createLinkedTokenSource`, `[Symbol.dispose]` |
| `ITimer` | The timer `cancelAfter` arms; `setTimeout`, `clearTimeout` |
| `CancellationToken` | Watches for cancellation; `none`, `isCancellationRequested`, `canBeCanceled`, `register`, `throwIfCancellationRequested` |
| `CancellationTokenRegistration` | A registered callback; `unregister`, `[Symbol.dispose]` |
| `OperationCanceledException` | An operation stopped because its cancellation was requested; `cancellationToken` |
| `CancellationCallbacksFailedException` | A cancellation callback threw; `errors` |
| `ThreadingException` | The base of the package's exceptions |

The package uses only the language's own built-ins and, for `cancelAfter`, the
host's timer, so it runs on every host, and it keeps its API when CONTEXT moves
onto its own Runtime.
