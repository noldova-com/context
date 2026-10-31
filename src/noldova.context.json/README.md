# noldova.context.json

Reads untrusted JSON into typed values in one place. `JsonReader` reads an
object's fields by name and type; every failure is a `JsonException` whose
`path`, such as `$.version`, names the field that is wrong.

## Install

```bash
npm install @noldova/context.json
```

## Use

```ts
import { JsonException, JsonReader } from "@noldova/context.json";

const reader = JsonReader.parse("{\"name\":\"Fixture\",\"version\":2}");
reader.readString("name"); // "Fixture"
reader.readInteger("version"); // 2
reader.readOptionalString("detail"); // undefined: the field is absent.

try {
  reader.readString("version");
}
catch (error) {
  if (!(error instanceof JsonException))
    throw error;
  error.path; // "$.version"
}
```

A required field must be present and not `null`; an `optional` accessor
accepts an absent field, and a `nullable` one accepts `null`. Unknown fields
are ignored. The declaration file `api/index.d.ts` documents every member with
its contract and examples.

## License

MIT; see `LICENSE`.
