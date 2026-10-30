/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from "node:path";

import { Assert, SourceMap, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourceMapSegmentTests {
  @TestMethod
  public selectsTheNearestPrecedingSegment(): void {
    const sourceMap = new SourceMap({ version: 3, sources: ["sample.ts"], mappings: "AACA,CADA" }, resolve("maps"));

    Assert.areEqual<number | undefined>(2, sourceMap.mapToSource(1, 0)?.line);
    Assert.areEqual<number | undefined>(1, sourceMap.mapToSource(1, 1)?.line);
  }
}
