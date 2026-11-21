# noldova.context.query.expressions

Expression trees for CONTEXT queries: code described as data, so a query
provider can run it, translate it to another language such as SQL, or reject
what it can't translate. Expressions are immutable, are built with the
`Expression` factories, and share every unchanged subtree when an operation
returns a new tree.

## Install

```bash
npm install @noldova/context.query.expressions
```

## Use

```ts
import { BinaryOperator, Expression } from "@noldova/context.query.expressions";

const person = Expression.parameter("person");
const isAdult = Expression.lambda([person],
  Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(person, "age"), Expression.constant(18)));

isAdult.toString(); // "person => person.age >= 18"

const other = Expression.parameter("other");
isAdult.replace(person, other).toString(); // "other => other.age >= 18"
```

The expressions are constants, parameters, member reads, `!`, the arithmetic,
comparison, `&&`, `||` and `??` operators, conditionals, method calls, object
literals and lambdas. Parameters are bound by identity, not by name.
`toString` writes TypeScript source for diagnostics, and `replace` puts one
expression in place of another throughout a tree, as combining two queries
needs. A package that runs or translates expressions adds that operation as an
extension method on `Expression`.

A chain of binary operators can be of any length and shape. Other nesting, such
as `!` inside `!` or a lambda inside a call, is supported to 1,000 levels; a
deeper tree may exceed the host's stack.

The public API, with an example for each part, is in
[`src/api/index.d.ts`](src/api/index.d.ts).
