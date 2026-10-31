# noldova.context.text

Text building blocks for CONTEXT libraries and parsers: a read-only view of part
of a string, a string builder, line-terminator rules, Unicode identifier
classification, and `String` additions that importing the package installs.

## Install

```bash
npm install @noldova/context.text
```

## Use

```ts
import { EcmaScriptLineTerminator, ReadOnlyStringSpan, StringBuilder, UnicodeCodePointService } from "@noldova/context.text";

const span = new ReadOnlyStringSpan("hello world", 6, 5);
span.toString(); // "world"
span.slice(1, 3).toString(); // "orl"; indexes are relative to the span.

const builder = new StringBuilder();
builder.append("hello").append(" ").append("world");
builder.toString(); // "hello world"

const terminator = new EcmaScriptLineTerminator();
terminator.getLength("a\r\nb", 1); // 2: CRLF.

UnicodeCodePointService.isIdentifierStart("a".codePointAt(0)!); // true
String.isAsciiOctalDigit("7"); // true
```

Lengths and offsets count UTF-16 code units, as JavaScript strings do. The
declaration file `api/index.d.ts` documents every member with its contract and
examples.

## License

MIT; see `LICENSE`. The Unicode identifier tables come from the Unicode
Character Database, under the Unicode License v3 in `THIRD-PARTY-NOTICES.txt`.
