/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { SourceLine } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourceLineTests {
  @TestMethod
  public carriesTheLineMetadata(): void {
    const line = new SourceLine(2, 5, 9, 2);

    Assert.areEqual(2, line.lineIndex);
    Assert.areEqual(5, line.startOffset);
    Assert.areEqual(9, line.endOffset);
    Assert.areEqual(2, line.lineBreakLength);
    Assert.areEqual(4, line.length);
  }

  @TestMethod
  public acceptsEveryLineBreakLength(): void {
    Assert.areEqual(0, new SourceLine(0, 0, 0, 0).lineBreakLength);
    Assert.areEqual(1, new SourceLine(0, 0, 0, 1).lineBreakLength);
    Assert.areEqual(2, new SourceLine(0, 0, 0, 2).lineBreakLength);
  }

  @TestMethod
  @TestData(-1)
  @TestData(0.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  public rejectsInvalidIndexes(lineIndex: number): void {
    const failure = Assert.throws(() => new SourceLine(lineIndex, 0, 0, 0), ArgumentOutOfRangeException);

    Assert.areEqual("lineIndex", failure.parameterName);
    Assert.areEqual(lineIndex, failure.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(0.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  public rejectsInvalidStartOffsets(startOffset: number): void {
    const failure = Assert.throws(() => new SourceLine(0, startOffset, 0, 0), ArgumentOutOfRangeException);

    Assert.areEqual("startOffset", failure.parameterName);
    Assert.areEqual(startOffset, failure.actualValue);
  }

  @TestMethod
  @TestData(0)
  @TestData(1.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  public rejectsInvalidEndOffsets(endOffset: number): void {
    const failure = Assert.throws(() => new SourceLine(0, 1, endOffset, 0), ArgumentOutOfRangeException);

    Assert.areEqual("endOffset", failure.parameterName);
    Assert.areEqual(endOffset, failure.actualValue);
  }
}
