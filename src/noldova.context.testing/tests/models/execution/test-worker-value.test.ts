/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, AssertFailedException, TestClass, TestData, TestingException, TestMethod, TestTimeoutException } from "@noldova/context.testing";
import { TestWorkerText } from "@noldova/context.testing/models/execution/test-worker-text.js";
import { TestWorkerValue } from "@noldova/context.testing/models/execution/test-worker-value.js";

@TestClass
export class TestWorkerValueTests {
  @TestData("text")
  @TestData(-0)
  @TestData(true)
  @TestData(10n)
  @TestData(null)
  @TestData(undefined)
  @TestMethod
  public keepsAPlainValue(value: unknown): void {
    Assert.areEqual(value, TestWorkerValueTests.cross(value));
  }

  @TestMethod
  public printsAnyOtherValueAsItPrinted(): void {
    const crossed = TestWorkerValueTests.cross({ toString: (): string => "sample value" });

    Assert.isInstanceOf(crossed, TestWorkerText);
    Assert.areEqual("sample value", String(crossed));
    Assert.areEqual("Symbol(sample)", String(TestWorkerValueTests.cross(Symbol("sample"))));
  }

  @TestMethod
  public printsAValueThatCannotPrintAsUnprintable(): void {
    Assert.areEqual("<unprintable value>", String(TestWorkerValueTests.cross(Object.create(null))));
  }

  @TestMethod
  public rebuildsAnAssertionFailureWithItsValues(): void {
    const failure = new AssertFailedException("Sample failed.", 1, { toString: (): string => "two" });

    const crossed = TestWorkerValueTests.cross(failure);

    Assert.isInstanceOf(crossed, AssertFailedException);
    Assert.areEqual("AssertFailedException", crossed.name);
    Assert.areEqual("Sample failed.", crossed.message);
    Assert.areEqual(failure.stack, crossed.stack);
    Assert.areEqual(1, crossed.expected);
    Assert.areEqual("two", String(crossed.actual));
  }

  @TestMethod
  public rebuildsATimeout(): void {
    const timeout = new TestTimeoutException(250);

    const crossed = TestWorkerValueTests.cross(timeout);

    Assert.isInstanceOf(crossed, TestTimeoutException);
    Assert.areEqual(250, crossed.timeoutMilliseconds);
    Assert.areEqual(timeout.message, crossed.message);
    Assert.areEqual(timeout.stack, crossed.stack);
  }

  @TestMethod
  public rebuildsAnyOtherErrorWithItsNameMessageAndStack(): void {
    const error = new RangeError("Sample out of range.");

    const crossed = TestWorkerValueTests.cross(error);

    Assert.isInstanceOf(crossed, Error);
    Assert.isFalse(crossed instanceof RangeError);
    Assert.areEqual("RangeError", crossed.name);
    Assert.areEqual("Sample out of range.", crossed.message);
    Assert.areEqual(error.stack, crossed.stack);
  }

  @TestMethod
  public keepsTheRebuiltStackOfAnErrorThatHadNone(): void {
    const error = new Error("Sample without a stack.");
    Object.defineProperty(error, "stack", { value: undefined });

    const crossed = TestWorkerValueTests.cross(error);

    Assert.isInstanceOf(crossed, Error);
    Assert.isUndefined(error.stack);
    Assert.isDefined(crossed.stack);
  }

  @TestMethod
  public printsTheNameAndMessageOfAnErrorWhenTheyAreNoStrings(): void {
    const error = new Error();
    Object.defineProperties(error, {
      name: { value: 7 },
      message: { value: { toString: (): string => "sample message" } },
      stack: { value: 42 },
    });

    const crossed = TestWorkerValueTests.cross(error);

    Assert.isInstanceOf(crossed, Error);
    Assert.areEqual("7", crossed.name);
    Assert.areEqual("sample message", crossed.message);
    Assert.isTrue(Object.isString(crossed.stack));
  }

  @TestData({ kind: "Paused" })
  @TestData({ value: {} })
  @TestData({ kind: "Assert" })
  @TestData({ details: [{}] })
  @TestMethod
  public rejectsDataThatIsNoValue(change: object): void {
    Assert.throws(() => TestWorkerValue.from({ ...TestWorkerValue.of(1).toData(), ...change }), TestingException);
  }

  private static cross(value: unknown): unknown {
    return TestWorkerValue.from(structuredClone(TestWorkerValue.of(value).toData())).toValue();
  }
}
