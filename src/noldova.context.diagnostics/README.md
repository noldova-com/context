# noldova.context.diagnostics

The diagnostic model CONTEXT parsers and tools report through: codes in an
authority's namespace (`TS` or `CTX`), categories, structured message chains,
source locations, related information and tags. A `Diagnostic` is complete and
immutable once created; reusable `DiagnosticTemplate`s create occurrences from a
catalog.

## Install

```bash
npm install @noldova/context.diagnostics
```

## Use

```ts
import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticLocation, DiagnosticTemplate } from "@noldova/context.diagnostics";

const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
const template = new DiagnosticTemplate(code, DiagnosticCategory.Error, "Cannot find name '{0}'.");

const diagnostic = template.create(new DiagnosticLocation("example.ts", 12, 5), ["value"]);
diagnostic.code.displayText; // "TS2304"
diagnostic.message.text; // "Cannot find name 'value'."
diagnostic.location?.start; // 12
```

Locations are UTF-16 offsets and lengths in a source. The declaration file
`api/index.d.ts` documents every member with its contract and examples.

## License

MIT; see `LICENSE`.
