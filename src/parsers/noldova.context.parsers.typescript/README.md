# noldova.context.parsers.typescript

A TypeScript parser. It turns TypeScript source, or declaration files, into a
syntax tree with source spans and reports syntax and grammar errors as
diagnostics, with TypeScript's codes and messages where TypeScript has them. It
recovers from errors, so a broken file still yields a tree. Name binding and
type checking are not part of it.

## Install

```bash
npm install @noldova/context.parsers.typescript
```

## Use

```ts
import { TypeScriptParser } from "@noldova/context.parsers.typescript";

const result = TypeScriptParser.parse("value + 1;", "example.ts");
result.rootNode.children.length; // 1
result.diagnostics.length; // 0

const broken = TypeScriptParser.parse("let x = ;", "broken.ts");
broken.diagnostics.map(t => `${t.code.displayText}: ${t.message.text}`); // Its syntax errors.
```

Regular-expression literals are parsed with `@noldova/context.parsers.regex`,
and their diagnostics appear among the file's. The declaration file
`api/index.d.ts` documents every member with its contract and examples.

## License

MIT; see `LICENSE`. The diagnostic messages come from the TypeScript compiler,
under the Apache License 2.0 in `THIRD-PARTY-NOTICES.txt`.
