/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException, ArgumentNullException, ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ArgumentNullExceptionTests {
  @TestMethod
  public takesTheParameterNameFirst(): void {
    const exception = new ArgumentNullException("input");

    Assert.areEqual("input", exception.parameterName);
    Assert.areEqual("Value cannot be null or undefined. (Parameter 'input')", exception.message);
  }

  @TestMethod
  public acceptsACustomMessage(): void {
    Assert.areEqual("Missing. (Parameter 'input')", new ArgumentNullException("input", "Missing.").message);
  }

  @TestMethod
  public preservesAnExplicitEmptyMessage(): void {
    Assert.areEqual("", new ArgumentNullException(undefined, "").message);
    Assert.areEqual(" (Parameter 'input')", new ArgumentNullException("input", "").message);
  }

  @TestMethod
  public preservesTheCause(): void {
    const cause = new Error("cause");

    Assert.areEqual<unknown>(cause, new ArgumentNullException("input", undefined, new ExceptionOptions(cause)).cause);
  }

  @TestMethod
  public setsTheName(): void {
    Assert.areEqual("ArgumentNullException", new ArgumentNullException("input").name);
  }

  @TestMethod
  public isAnArgumentException(): void {
    Assert.isInstanceOf(new ArgumentNullException("input"), ArgumentException);
  }

  @TestMethod
  public throwIfNullThrowsForNull(): void {
    const exception = Assert.throws(() => {
      ArgumentNullException.throwIfNull(null, "input");
    }, ArgumentNullException);

    Assert.areEqual("input", exception.parameterName);
  }

  @TestMethod
  public throwIfNullThrowsForUndefined(): void {
    Assert.throws(() => {
      ArgumentNullException.throwIfNull(undefined, "input");
    }, ArgumentNullException);
  }

  @TestMethod
  @TestData("value", 5)
  @TestData("", 0)
  public throwIfNullPassesForAValueAndNarrows(value: string | null | undefined, expectedLength: number): void {
    ArgumentNullException.throwIfNull(value, "value");

    Assert.areEqual(expectedLength, value.length);
  }

  @TestMethod
  @TestData(0)
  @TestData(false)
  @TestData({ setting: "on" })
  public throwIfNullPassesForNonNullValues(value: unknown): void {
    Assert.doesNotThrow(() => ArgumentNullException.throwIfNull(value, "value"));
  }
}
