# noldova.context.collections

Collections for CONTEXT libraries and apps, with queries over them:
`List`, `Dictionary`, `HashSet`, `Queue` and `Stack`, each an `Enumerable` with
the query operators; `ChunkedList`, a list held in chunks that sums its
elements' weights; read-only views; equality and ordering comparers; and
`BinarySearchService`, which finds an item's position and the lower and upper
bounds of a key in sorted arrays and lists, as `List.binarySearch` and
`ChunkedList.binarySearch` do for their own items.

## Install

```bash
npm install @noldova/context.collections
```

## Use

```ts
import { Enumerable, List } from "@noldova/context.collections";

class Account {
  public readonly id: number;
  public readonly name: string;
  public readonly age: number;
  public readonly active: boolean;

  public constructor(id: number, name: string, age: number, active: boolean) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.active = active;
  }
}

const accounts = new List([
  new Account(1, "Ana", 31, true),
  new Account(2, "Leo", 42, false),
  new Account(3, "Mia", 27, true)
]);

accounts.where(t => t.active).orderBy(t => t.age).select(t => t.name).toArray(); // ["Mia", "Ana"]
accounts.firstOrDefault(t => t.age > 50); // undefined
accounts.first(t => t.age > 50); // throws InvalidOperationException

const byId = accounts.toDictionary(t => t.id, t => t);
byId.get(2).name; // "Leo"
byId.tryGet(9); // undefined

Enumerable.from([3, 1, 2]).orderByDescending(t => t).take(2).toArray(); // [3, 2]
```

A `ChunkedList` suits a long list that is mostly one value, such as a count
of matches for each line of a large text. A chunk that holds only that value
takes no storage until an element in it is set, and each chunk keeps the sum
of its elements' weights:

```ts
import { ChunkedList } from "@noldova/context.collections";

const matches = new ChunkedList<number>(1024, 0, 100_000, t => t);
matches.set(10, 2);
matches.set(500, 3);
matches.totalWeight; // 5
matches.weightBefore(500); // 2
matches.nextWeightedIndex(11); // 500
```

Arrays stay native: `Enumerable.from` gives any iterable the operators, and
`new List(array)` copies one into a list. Operators that return a sequence are
deferred and run again on each enumeration. A method that needs an element
throws when there is none; its `…OrDefault` or `try…` form returns `undefined`,
since `undefined` means there is no value and `null` is a value someone set.
The declaration file `api/index.d.ts` documents every member with its contract
and examples.

## License

MIT; see `LICENSE`.
