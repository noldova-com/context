# noldova.context.parsers.regex

A parser for ECMAScript regular expressions, aligned with TypeScript 7.0.2 and
Unicode 15.1. It turns a pattern and its flags into a syntax tree with source
spans and reports every syntax error as a diagnostic, without executing the
pattern. It parses a standalone pattern or one embedded in a larger source,
such as a regular-expression literal in TypeScript.

## Install

```bash
npm install @noldova/context.parsers.regex
```

## Use

```ts
import { RegexParser } from "@noldova/context.parsers.regex";

const result = new RegexParser("a+", "u").parse();
result.diagnostics.length; // 0
result.rootNode.patternNode.value; // "a+"

const invalid = new RegexParser("(", "u").parse();
invalid.diagnostics.length > 0; // true: syntax errors are data, not exceptions.
```

Each `RegexParser` parses once; create a new one for each pattern. The
declaration file `api/index.d.ts` documents every member with its contract and
examples.

## License

MIT; see `LICENSE`.
