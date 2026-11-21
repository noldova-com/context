# noldova.context.query

Queries for CONTEXT, built as expression trees: a `Queryable` holds a query's
tree and the provider that runs it, so the same query can run in memory or be
translated to another language such as SQL.

## Install

```bash
npm install @noldova/context.query
```

## Use

```ts
import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
import { InMemoryQueryProvider } from "@noldova/context.query";

const people = new InMemoryQueryProvider().from([new Person("Ana", 34), new Person("Ion", 17)]);
const person = Expression.parameter("person");
const adults = people.where(Expression.lambda<(person: Person) => boolean>([person],
  Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(person, "age"), Expression.constant(18))));

await adults.countAsync(); // 1
for await (const adult of adults)
  console.log(adult.name); // "Ana"
```

The operators are `where`, `select`, `orderBy`, `orderByDescending`, `thenBy`,
`thenByDescending`, `skip` and `take`; each returns a new query, and nothing
runs until a result is asked for. The results are asynchronous:
`toArrayAsync`, `firstAsync`, `firstOrDefaultAsync`, `singleAsync`,
`singleOrDefaultAsync`, `anyAsync`, `countAsync`, and `for await` over the
query.

A `QueryProvider` runs a query's tree. `InMemoryQueryProvider` runs it with
`Enumerable`'s operators from `@noldova/context.collections`, compiling each
lambda once to a function without `eval` or `new Function`. It evaluates as
TypeScript does, within the limits its documentation lists: arithmetic and
`-`, `*` and `/` need two numbers or two bigints, and `+` also takes a string
on either side; a comparison needs two numbers or bigints, two strings or two
dates. A chain of `&&`, `||` or `??` can be of any length, while other nesting
is supported to 1,000 levels.

The lambdas are built with the factories of
`@noldova/context.query.expressions`.

The public API, with an example for each part, is in
[`src/api/index.d.ts`](src/api/index.d.ts).
