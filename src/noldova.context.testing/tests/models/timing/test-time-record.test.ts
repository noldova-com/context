/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, KeyValuePair } from "@noldova/context.collections";
import {
  Assert, TestClass, TestClassResult, TestData, TestingException, TestMethod, TestMethodResult, TestOutcome, TestRunResult, TestTimeRecord
} from "@noldova/context.testing";

@TestClass
export class TestTimeRecordTests {
  @TestMethod
  public formatsTheSlowestTestsUnderAHeadingSlowestFirst(): void {
    const records = [
      new TestTimeRecord("Sample", "a.test.js", "ATests", "adds", undefined, TestOutcome.Passed, 12.4),
      new TestTimeRecord("Sample", "b.test.js", "BTests", "reads", 2, TestOutcome.Failed, 5650),
      new TestTimeRecord("Sample", "c.test.js", "CTests", "waits", undefined, TestOutcome.Passed, 40)
    ];

    Assert.areEqual(["Slowest tests:", "  5650 ms  Sample/b.test.js — BTests.reads[2]", "  40 ms  Sample/c.test.js — CTests.waits"].join("\n"),
      TestTimeRecord.formatSlowest(records, 2).join("\n"));
    Assert.areEqual(0, TestTimeRecord.formatSlowest([], 10).length);
  }

  @TestMethod
  public namesTheTestWithItsPackageFileClassMethodAndRow(): void {
    const record = new TestTimeRecord("Sample", "math/adds.test.js", "AddsTests", "adds", 2, TestOutcome.Passed, 4);

    Assert.areEqual("Sample/math/adds.test.js", record.file);
    Assert.areEqual("Sample/math/adds.test.js — AddsTests.adds[2]", record.test);
    Assert.areEqual("Sample/math/adds.test.js — AddsTests.adds", new TestTimeRecord("Sample", "math/adds.test.js", "AddsTests", "adds", undefined,
      TestOutcome.Passed, 4).test);
  }

  @TestMethod
  public listsEachTestOfARunWithItsClassFile(): void {
    const passed = new TestMethodResult("Sample", "AddsTests", "adds", undefined, [], TestOutcome.Passed, 3, undefined, undefined);
    const skipped = new TestMethodResult("Sample", "AddsTests", "addsRows", 1, [1], TestOutcome.Skipped, 0, undefined, "Not yet.");
    const records = TestTimeRecord.fromResult(new TestRunResult([new TestClassResult("Sample", "AddsTests", "adds.test.js", [passed, skipped])]));

    Assert.areEqual("Sample/adds.test.js — AddsTests.adds:Passed:3,Sample/adds.test.js — AddsTests.addsRows[1]:Skipped:0",
      records.map(t => `${t.test}:${t.outcome}:${t.durationMilliseconds}`).join());
  }

  @TestMethod
  public readsBackWhatItWrites(): void {
    const written = [
      new TestTimeRecord("Sample", "adds.test.js", "AddsTests", "adds", undefined, TestOutcome.Failed, 12.5),
      new TestTimeRecord("Sample", "adds.test.js", "AddsTests", "addsRows", 0, TestOutcome.Passed, 0)
    ];

    const read = TestTimeRecord.parseAll(TestTimeRecord.formatAll(written));

    Assert.areEqual(TestTimeRecord.formatAll(written), TestTimeRecord.formatAll(read));
    Assert.isUndefined(read[0]?.testDataIndex);
    Assert.areEqual(0, read[1]?.testDataIndex);
  }

  @TestData("not json")
  @TestData("{}")
  @TestData("[null]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\"}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":-1}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Won\",\"durationMilliseconds\":1}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"testDataIndex\":1.5,\"outcome\":\"Passed\",\"durationMilliseconds\":1}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"testDataIndex\":\"1\",\"outcome\":\"Passed\",\"durationMilliseconds\":1}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":7,\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":1}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":1,\"attachments\":[]}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":1,\"attachments\":\"1.234\"}]")
  @TestData("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":1,\"attachments\":{\"ratio\":1.234}}]")
  @TestMethod
  public rejectsTextThatIsNotAnArrayOfRecords(text: string): void {
    const failure = Assert.throws(() => TestTimeRecord.parseAll(text), TestingException);

    Assert.areEqual("The test times must be a JSON array of results, each with its package, file, class and method names, an optional non-negative "
      + "integer data row, an outcome, a non-negative duration, and optional attachments of text.", failure.message);
  }

  @TestMethod
  public writesAndReadsBackTheAttachments(): void {
    const measured = new TestTimeRecord("Sample", "a.test.js", "ATests", "measures", undefined, TestOutcome.Passed, 2,
      new Dictionary([new KeyValuePair("ratio", "1.234"), new KeyValuePair("count", "3")]));
    const plain = new TestTimeRecord("Sample", "a.test.js", "ATests", "adds", undefined, TestOutcome.Passed, 1);

    const text = TestTimeRecord.formatAll([measured, plain]);
    const [read, readPlain] = TestTimeRecord.parseAll(text);

    Assert.areEqual("[{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\",\"className\":\"ATests\",\"methodName\":\"measures\",\"outcome\":\"Passed\","
      + "\"durationMilliseconds\":2,\"attachments\":{\"ratio\":\"1.234\",\"count\":\"3\"}},{\"packageName\":\"Sample\",\"filePath\":\"a.test.js\","
      + "\"className\":\"ATests\",\"methodName\":\"adds\",\"outcome\":\"Passed\",\"durationMilliseconds\":1}]", text);
    Assert.areEqual("ratio=1.234,count=3", [...read?.attachments ?? []].map(t => `${t.key}=${t.value}`).join());
    Assert.areEqual(0, readPlain?.attachments.count());
  }

  @TestMethod
  public keepsItsOwnCopyOfTheAttachments(): void {
    const attachments = new Dictionary([new KeyValuePair("ratio", "1.234")]);
    const record = new TestTimeRecord("Sample", "a.test.js", "ATests", "measures", undefined, TestOutcome.Passed, 2, attachments);
    attachments.set("ratio", "2");
    attachments.add("count", "3");

    Assert.areEqual("ratio=1.234", [...record.attachments].map(t => `${t.key}=${t.value}`).join());
  }

  @TestMethod
  public listsTheAttachmentsOfEachTestOfARun(): void {
    const measured = new TestMethodResult("Sample", "ATests", "measures", undefined, [], TestOutcome.Passed, 2, undefined, undefined,
      new Dictionary([new KeyValuePair("ratio", "1.234")]));

    const [record] = TestTimeRecord.fromResult(new TestRunResult([new TestClassResult("Sample", "ATests", "a.test.js", [measured])]));

    Assert.areEqual("1.234", record?.attachments.get("ratio"));
  }

  @TestMethod
  public listsTheSlowestFirstWithoutChangingItsInput(): void {
    const records = [1, 9, 4, 7].map(t => new TestTimeRecord("Sample", "a.test.js", "ATests", `m${t}`, undefined, TestOutcome.Passed, t));

    Assert.areEqual("m9,m7", TestTimeRecord.slowest(records, 2).map(t => t.methodName).join());
    Assert.areEqual("m1,m9,m4,m7", records.map(t => t.methodName).join());
  }
}
