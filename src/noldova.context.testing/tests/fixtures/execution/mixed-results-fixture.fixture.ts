/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, Skip, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class MixedResultsFixtureTests {
  @TestMethod
  public passes(): void { }

  @TestMethod
  public failsAnAssertion(): void {
    Assert.areEqual(1, 2);
  }

  @TestMethod
  public throwsAnError(): void {
    throw new RangeError("Sample out of range.");
  }

  @TestMethod
  public throwsAValue(): void {
    throw "sample thrown";
  }

  @TestMethod
  @TestData("ab", 2)
  @TestData("abc", 2)
  public measures(value: string, length: number): void {
    Assert.areEqual(length, value.length);
  }

  @TestMethod
  @TestData({ toString: (): string => "sample row" })
  public receivesAnObject(value: object): void {
    Assert.isNotNull(value);
  }

  @TestMethod
  @Skip("not yet")
  public waits(): void { }
}
