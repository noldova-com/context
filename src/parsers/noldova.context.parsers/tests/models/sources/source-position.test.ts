/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { SourcePosition } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourcePositionTests {
  @TestMethod
  public carriesTheDerivedCoordinates(): void {
    const position = new SourcePosition(2, 4);

    Assert.areEqual(2, position.lineIndex);
    Assert.areEqual(4, position.characterIndex);
  }

  @TestMethod
  @TestData(-1)
  @TestData(0.5)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  public rejectsInvalidLineIndexes(lineIndex: number): void {
    const failure = Assert.throws(() => new SourcePosition(lineIndex, 0), ArgumentOutOfRangeException);

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
  public rejectsInvalidCharacterIndexes(characterIndex: number): void {
    const failure = Assert.throws(() => new SourcePosition(0, characterIndex), ArgumentOutOfRangeException);

    Assert.areEqual("characterIndex", failure.parameterName);
    Assert.areEqual(characterIndex, failure.actualValue);
  }
}
