# noldova.context.parsers

The shared foundation for CONTEXT language parsers: an immutable source with
spans and line positions, a reader over it, and the lexer and parser base
classes every language parser builds on. It contains no grammar; TypeScript,
Regex, and future languages are separate packages.

## Install

```bash
npm install @noldova/context.parsers
```

## Model

- `Source` holds the text once. `SourceSpan` is a half-open UTF-16 range in it;
  `SourceLineMap` maps offsets to lines and back.
- `SourceReader` is a cursor over a source or a bounded region of it. At the end
  it returns the null character and code point 0, so a lexer compares characters
  instead of checking for the end; where a null character can be legitimate
  input, `isAtEnd` decides.
- `Node` is the base of every syntax node: a span and optional trivia. A
  language adds behavior to nodes through declaration merging in its own
  package; grammar code recognizes node types with `instanceof`.
- `Lexer` owns its reader, reports into the parser context's diagnostic
  collector, and produces one node per call. It checks two invariants for
  every language: a lex either advances or produces the `EndOfFileNode`
  exactly at the end, and re-lexing obeys the same rules.
- `Parser` holds one current node. It advances, consumes by node type, looks
  ahead and tries interpretations with exact rewind, and re-lexes the current
  node when the grammar position changes what a token means, such as `>>`
  inside type arguments or `/` beginning a regular expression.
- `ParserContext` carries grammar state and owns the published
  `DiagnosticCollector`. A language derives its own context for its flags and
  caches.

## Diagnostics

One sequence, owned by the parser context, receives every diagnostic in the
order it is reported: the lexer's as each node is lexed, the grammar's as it
parses. That is the sequence grammar decisions may consult. A rewind restores
the current node, the reader offset, and the sequence length, and nothing is
ever removed from the middle. A re-lex removes nothing either; the replacement
scan reports after what is already there, and a language whose scans can
repeat a diagnostic at the same position applies its own suppression rule, as
TypeScript does with tsc's same-offset rule.

## Trust boundary

Positions handed back to the reader, through `seek`, `advance`, a relative peek,
or span creation, come from the reader itself and are not validated again;
this keeps the per-token path free of checks. Everything that accepts an offset
or span from elsewhere validates it: `Source`, the `SourceReader` constructor,
`SourceLineMap`, `SourceLine`, and `SourcePosition`.

## Use

A language parser derives its nodes, lexer and parser from these classes:

```ts
import { DiagnosticCollector, EndOfFileNode, Lexer, LiteralNode, Node, Parser, ParserContext, Source, SourceSpan } from "@noldova/context.parsers";

class TextLiteralNode extends LiteralNode {
  public constructor(value: string, span: SourceSpan) {
    super(value, span);
  }
}

class TextLexer extends Lexer {
  public constructor(source: Source, diagnosticCollector: DiagnosticCollector) {
    super(source, diagnosticCollector);
  }

  protected override lexNode(): Node {
    const startOffset = this.reader.currentOffset;
    if (this.reader.isAtEnd)
      return new EndOfFileNode(new SourceSpan(startOffset, 0));

    const text = this.reader.readWhile(() => true).toString();
    return new TextLiteralNode(text, new SourceSpan(startOffset, text.length));
  }
}

class TextParser extends Parser<LiteralNode> {
  public constructor(context: ParserContext, lexer: TextLexer) {
    super(context, lexer);
  }

  protected override parseRootNode(): LiteralNode {
    const root = this.requireCurrentNode(LiteralNode);
    this.advance();
    return root;
  }
}

const source = new Source("text");
const context = new ParserContext(source);
const result = new TextParser(context, new TextLexer(source, context.diagnosticCollector)).parse();
console.assert(result.rootNode.value === "text" && result.diagnostics.length === 0);
```

The example's `console` needs Node's types: `@types/node`, with
`"types": ["node"]` in `tsconfig.json`. The declaration file `api/index.d.ts`
documents every member with its contract and examples.

## License

MIT; see `LICENSE`.
