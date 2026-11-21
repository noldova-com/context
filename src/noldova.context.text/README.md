# noldova.context.text

Text building blocks for CONTEXT libraries and parsers: a read-only view of part
of a string, a string builder, line-terminator rules, decoding of three-digit
octal escapes, an order of strings by Unicode code point, Unicode identifier
classification, and `String` additions that importing the package installs.

## Install

```bash
npm install @noldova/context.text
```

## Use

```ts
import { CodePointOrderService, EcmaScriptLineTerminator, OctalEscapeService, ReadOnlyStringSpan, StringBuilder, UnicodeCodePointService } from "@noldova/context.text";

const span = new ReadOnlyStringSpan("hello world", 6, 5);
span.toString(); // "world"
span.slice(1, 3).toString(); // "orl"; indexes are relative to the span.

const builder = new StringBuilder();
builder.append("hello").append(" ").append("world");
builder.toString(); // "hello world"

const terminator = new EcmaScriptLineTerminator();
terminator.getLength("a\r\nb", 1); // 2: CRLF.

// Linux's mount tables write a space in a mount point as \040; split each
// line into its fields first, then decode each field. Each escape becomes one
// character, so formats that escape UTF-8 bytes, such as git's quoted paths,
// need a decoder of their own.
OctalEscapeService.decode("/media/USB\\040Drive"); // "/media/USB Drive"

// The same order under every locale, as UTF-8 bytes sort.
["b", "a", "B", "@scope/a"].sort(CodePointOrderService.compare); // ["@scope/a", "B", "a", "b"]

UnicodeCodePointService.isIdentifierStart("a".codePointAt(0)!); // true
String.isAsciiOctalDigit("7"); // true
```

Lengths and offsets count UTF-16 code units, as JavaScript strings do. The
declaration file `api/index.d.ts` documents every member with its contract and
examples.

## License

MIT; see `LICENSE`. The Unicode identifier tables come from the Unicode
Character Database, under the Unicode License v3 in `THIRD-PARTY-NOTICES.txt`.
They are generated from the Unicode 15.1 `ID_Start` and `ID_Continue`
properties in
[DerivedCoreProperties.txt](https://www.unicode.org/Public/15.1.0/ucd/DerivedCoreProperties.txt),
whose SHA-256 is
`f55d0db69123431a7317868725b1fcbf1eab6b265d756d1bd7f0f6d9f9ee108b`.
