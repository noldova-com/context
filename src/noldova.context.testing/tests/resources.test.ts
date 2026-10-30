/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, AssertFailedException, CoverageReportWriter, CoverageResult, FileCoverage, LineRange, TestClass, TestMethod, TestTimeoutException } from "@noldova/context.testing";

@TestClass
export class ResourcesTests {
  @TestMethod
  public defaultsAssertionFailuresToTheCanonicalMessage(): void {
    Assert.areEqual("Assertion failed.", new AssertFailedException().message);
  }

  @TestMethod
  public reportsTheCanonicalConditionMessages(): void {
    Assert.areEqual("Expected the condition to be true.", Assert.throws(() => Assert.isTrue(false), AssertFailedException).message);
    Assert.areEqual("Expected the condition to be false.", Assert.throws(() => Assert.isFalse(true), AssertFailedException).message);
  }

  @TestMethod
  public reportsTheCanonicalEqualityMessage(): void {
    Assert.areEqual("Expected the values to be equal.", Assert.throws(() => Assert.areEqual(1, 2), AssertFailedException).message);
  }

  @TestMethod
  public reportsTheCanonicalTimeoutMessage(): void {
    Assert.areEqual("The test did not settle within the allotted timeout.", new TestTimeoutException(5).message);
  }

  @TestMethod
  public colorsCoverageLevelsCanonically(): void {
    const lines = new CoverageReportWriter().formatLines(new CoverageResult([
      new FileCoverage("noldova.context.core", "green.ts", [new LineRange(1, 1)], 100, 5, []),
      new FileCoverage("noldova.context.core", "yellow.ts", [new LineRange(1, 1)], 100, 25, []),
      new FileCoverage("noldova.context.core", "red.ts", [new LineRange(1, 2)], 100, 50, []),
    ]), false);

    Assert.isTrue(lines.some(t => t.includes("green.ts") && t.includes("\u001b[32m")));
    Assert.isTrue(lines.some(t => t.includes("yellow.ts") && t.includes("\u001b[33m")));
    Assert.isTrue(lines.some(t => t.includes("red.ts") && t.includes("\u001b[31m")));
  }
}
