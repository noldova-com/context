# noldova.context.collections

Collection algorithms for CONTEXT libraries. Today it holds
`BinarySearchService`, which finds positions in ascending numeric arrays, such
as the line that holds a character offset.

## Install

```bash
npm install @noldova/context.collections
```

## Use

```ts
import { BinarySearchService } from "@noldova/context.collections";

const lineStarts = [0, 12, 30, 41];

BinarySearchService.floorIndex(lineStarts, 30); // 2: an exact match.
BinarySearchService.floorIndex(lineStarts, 35); // 2: the nearest lower value is 30.
BinarySearchService.floorIndex(lineStarts, 0); // 0
BinarySearchService.floorIndex([], 5); // -1: no value qualifies.
```

The array must be sorted from smallest to greatest; the search does not check
or change it. The declaration file `api/index.d.ts` documents every member with
its contract and examples.

## License

MIT; see `LICENSE`.
