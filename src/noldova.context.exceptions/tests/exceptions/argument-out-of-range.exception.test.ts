/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException, ArgumentOutOfRangeException, ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ArgumentOutOfRangeExceptionTests {
  @TestMethod
  public defaultsTheMessageAndCarriesTheParameter(): void {
    const failure = new ArgumentOutOfRangeException("index", 5);

    Assert.areEqual("The argument must be within the valid range. (Parameter 'index')", failure.message);
    Assert.areEqual("index", failure.parameterName);
    Assert.areEqual(5, failure.actualValue);
  }

  @TestMethod
  public acceptsACustomMessageAndCause(): void {
    const cause = new Error("cause");
    const failure = new ArgumentOutOfRangeException("index", 5, "Invalid index.", new ExceptionOptions(cause));

    Assert.areEqual("Invalid index. (Parameter 'index')", failure.message);
    Assert.areEqual(cause, failure.cause);
  }

  @TestMethod
  public preservesAnExplicitEmptyMessage(): void {
    Assert.areEqual("", new ArgumentOutOfRangeException(undefined, 0, "").message);
    Assert.areEqual(" (Parameter 'index')", new ArgumentOutOfRangeException("index", 0, "").message);
  }

  @TestMethod
  public setsTheName(): void {
    Assert.areEqual("ArgumentOutOfRangeException", new ArgumentOutOfRangeException().name);
  }

  @TestMethod
  public isAnArgumentException(): void {
    Assert.isInstanceOf(new ArgumentOutOfRangeException(), ArgumentException);
  }

  @TestMethod
  @TestData(0)
  @TestData(-1)
  @TestData(0.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public throwsForValuesThatAreNotPositiveIntegers(value: number): void {
    const exception = Assert.throws(() => ArgumentOutOfRangeException.throwIfNotPositiveInteger(value, "count"), ArgumentOutOfRangeException);

    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(value, exception.actualValue);
  }

  @TestMethod
  public guardPreservesACustomMessage(): void {
    const exception = Assert.throws(
      () => ArgumentOutOfRangeException.throwIfNotPositiveInteger(0, "count", "A positive count is required."),
      ArgumentOutOfRangeException);

    Assert.areEqual("A positive count is required. (Parameter 'count')", exception.message);
    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(0, exception.actualValue);
  }

  @TestMethod
  @TestData(1)
  @TestData(Number.MAX_SAFE_INTEGER)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  public acceptsPositiveIntegersWithoutImposingASafeIntegerLimit(value: number): void {
    Assert.doesNotThrow(() => ArgumentOutOfRangeException.throwIfNotPositiveInteger(value, "count"));
  }
}
