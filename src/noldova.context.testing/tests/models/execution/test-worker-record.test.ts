/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestingException, TestMethod } from "@noldova/context.testing";
import { TestWorkerRecord } from "@noldova/context.testing/models/execution/test-worker-record.js";

@TestClass
export class TestWorkerRecordTests {
  @TestMethod
  public readsEachFieldItsKindAllows(): void {
    const record = TestWorkerRecord.from({
      name: "Sample",
      flag: true,
      count: 3,
      duration: 1.5,
      names: ["a", "b"],
      records: [{ name: "inner" }],
      values: [1, "two"],
    });

    Assert.areEqual("Sample", record.string("name"));
    Assert.isTrue(record.boolean("flag"));
    Assert.areEqual(3, record.count("count"));
    Assert.areEqual(1.5, record.duration("duration"));
    Assert.areEqual("a,b", record.strings("names").join());
    Assert.areEqual("inner", record.records("records")[0]!.string("name"));
    Assert.areEqual(true, record.value("flag"));
    Assert.areEqual("1,two", record.values("values").join());
  }

  @TestMethod
  public readsAnOptionalFieldThatIsPresentOrMissing(): void {
    const record = TestWorkerRecord.from({ name: "Sample", count: 3 });

    Assert.areEqual("Sample", record.optionalString("name"));
    Assert.areEqual(3, record.optionalCount("count"));
    Assert.isUndefined(record.optionalString("missing"));
    Assert.isUndefined(record.optionalCount("missing"));
  }

  @TestData("not an object")
  @TestData(null)
  @TestData([1])
  @TestMethod
  public rejectsAValueThatIsNoRecord(value: unknown): void {
    Assert.throws(() => TestWorkerRecord.from(value), TestingException);
  }

  @TestMethod
  public rejectsAFieldOfAnotherKind(): void {
    const record = TestWorkerRecord.from({ field: -1, strings: [1], records: [2] });

    Assert.throws(() => record.string("field"), TestingException);
    Assert.throws(() => record.boolean("field"), TestingException);
    Assert.throws(() => record.count("field"), TestingException);
    Assert.throws(() => record.optionalString("field"), TestingException);
    Assert.throws(() => record.optionalCount("field"), TestingException);
    Assert.throws(() => record.duration("field"), TestingException);
    Assert.throws(() => record.strings("strings"), TestingException);
    Assert.throws(() => record.records("records"), TestingException);
  }

  @TestMethod
  public rejectsAMissingArray(): void {
    Assert.throws(() => TestWorkerRecord.from({}).strings("names"), TestingException);
  }
}
