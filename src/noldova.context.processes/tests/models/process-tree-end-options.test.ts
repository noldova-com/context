/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { ProcessTreeEndOptions } from "@noldova/context.processes";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessTreeEndOptionsTests {
  @TestMethod
  public endsAtOnceWithinTenSecondsByDefault(): void {
    const options = new ProcessTreeEndOptions();

    Assert.areEqual(0, options.graceMilliseconds);
    Assert.areEqual(10_000, options.limitMilliseconds);
  }

  @TestMethod
  public keepsAGraceAndALimit(): void {
    const options = new ProcessTreeEndOptions(500, 0);

    Assert.areEqual(500, options.graceMilliseconds);
    Assert.areEqual(0, options.limitMilliseconds);
  }

  @TestData(-1, 0, "graceMilliseconds")
  @TestData(0.5, 0, "graceMilliseconds")
  @TestData(0, -1, "limitMilliseconds")
  @TestData(0, Number.POSITIVE_INFINITY, "limitMilliseconds")
  @TestMethod
  public refusesATimeThatIsNotAnIntegerFromZero(graceMilliseconds: number, limitMilliseconds: number, parameterName: string): void {
    const error = Assert.throws(() => new ProcessTreeEndOptions(graceMilliseconds, limitMilliseconds), ArgumentOutOfRangeException);

    Assert.areEqual(parameterName, error.parameterName);
  }
}
