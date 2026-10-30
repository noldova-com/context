/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, BlockCoverage, CoverageReportWriter, CoverageResult, FileCoverage, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CoverageReportRowTests {
  @TestMethod
  public carriesTheProjectAndFileCellsIntoTheReport(): void {
    const lines = new CoverageReportWriter().formatLines(new CoverageResult([
      new FileCoverage("noldova.context.core", "api/index.ts", [], 200, 0, [new BlockCoverage(1, true)]),
      new FileCoverage("noldova.context.core", "extensions/string.extensions.ts", [], 200, 0, []),
      new FileCoverage("noldova.context.testing", "assert.ts", [], 200, 0, []),
    ]), false);

    Assert.areEqual(1, lines.filter(t => t.includes(" noldova.context.core ")).length);
    Assert.areEqual(1, lines.filter(t => t.includes(" noldova.context.testing ")).length);
    Assert.isTrue(lines.some(t => t.includes("  api/index.ts") && t.includes("100.0%") && t.includes("1/1")));
    Assert.isTrue(lines.some(t => t.includes("  extensions/string.extensions.ts")));
  }
}
