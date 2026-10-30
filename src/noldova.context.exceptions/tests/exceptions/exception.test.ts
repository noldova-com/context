/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { SampleException } from "../fixtures/sample-exception.fixture.js";

@TestClass
export class ExceptionTests {
  @TestMethod
  public setsNameToTheConcreteClassName(): void {
    Assert.areEqual("SampleException", new SampleException("message").name);
  }

  @TestMethod
  public preservesTheMessage(): void {
    Assert.areEqual("the reason", new SampleException("the reason").message);
  }

  @TestMethod
  public preservesAnExplicitEmptyMessage(): void {
    Assert.areEqual("", new SampleException("").message);
  }

  @TestMethod
  public preservesTheCause(): void {
    const cause = new Error("root cause");
    const exception = new SampleException("outer", new ExceptionOptions(cause));

    Assert.areEqual<unknown>(cause, exception.cause);
  }

  @TestMethod
  @TestData(0)
  @TestData(false)
  @TestData(null)
  @TestData("")
  @TestData(undefined)
  public preservesFalsyCauses(cause: unknown): void {
    const exception = new SampleException("outer", new ExceptionOptions(cause));

    Assert.areEqual(cause, exception.cause);
  }

  @TestMethod
  public hasNoCauseWhenNoneIsGiven(): void {
    Assert.isUndefined(new SampleException("message").cause);
  }

  @TestMethod
  public isAnError(): void {
    Assert.isInstanceOf(new SampleException("message"), Error);
  }
}
