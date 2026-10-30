/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptRegionSet } from "@noldova/context.parsers.typescript/models/typescript-region-set.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptRegionSetTests {
  @TestData(0, false)
  @TestData(9, false)
  @TestData(10, true)
  @TestData(14, true)
  @TestData(19, true)
  @TestData(20, false)
  @TestData(30, true)
  @TestData(34, true)
  @TestData(35, false)
  @TestMethod
  public containsAnOffsetInsideAnOutermostRegion(offset: number, expected: boolean): void {
    const regions = new TypeScriptRegionSet([new SourceSpan(30, 5), new SourceSpan(10, 10), new SourceSpan(12, 3)]);

    Assert.isFalse(regions.isEmpty);
    Assert.areEqual(expected, regions.contains(offset));
  }

  @TestMethod
  public containsNothingWithoutRegions(): void {
    const regions = new TypeScriptRegionSet([]);

    Assert.isTrue(regions.isEmpty);
    Assert.isFalse(regions.contains(0));
  }
}
