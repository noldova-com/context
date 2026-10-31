# noldova.context.testing

A test framework for TypeScript: tests are exported classes marked with
decorators, discovered from compiled test files, run in parallel worker threads,
and reported with their results and code coverage. A test that overruns its
timeout is recorded as timed out, and the run goes on.

## Install

```bash
npm install @noldova/context.testing
```

## Use

### Write tests

A test class is exported, its name ends in `Tests`, and it is saved in a file
whose name ends in `.test.ts`:

```ts
import { Assert, Category, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@Category("Unit")
@TestClass
export class AdditionTests {
  @TestData(2, 3, 5)
  @TestData(-1, 1, 0)
  @TestMethod
  public adds(left: number, right: number, expected: number): void {
    Assert.areEqual(expected, left + right);
  }
}
```

Each `TestData` row runs and is reported as a test of its own.

### Run tests

Compile the tests, then run their compiled folder:

```ts
import { ParallelTestRunner, TestProject } from "@noldova/context.testing";

const result = await new ParallelTestRunner(5000).runAsync([new TestProject("Sample", "./compiled/tests")], ["category:Unit"]);
console.log(`${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`);
```

The first argument is each test's timeout in milliseconds; leaving out the
filters runs every test. `TestConsoleReporter`, `TestReportWriter` and
`CoverageReportWriter` print and write the results. The example's `console`
needs Node's types: `@types/node`, with `"types": ["node"]` in `tsconfig.json`.
The declaration file `api/index.d.ts` documents every member with its contract
and examples.

## License

MIT; see `LICENSE`.
