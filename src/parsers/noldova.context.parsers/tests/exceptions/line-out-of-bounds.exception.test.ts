/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { LineOutOfBoundsException, ParserException } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LineOutOfBoundsExceptionTests {
  @TestMethod
  public carriesTheInvalidLine(): void {
    const cause = new Error("cause");
    const failure = new LineOutOfBoundsException(3, 2, new ExceptionOptions(cause));

    Assert.areEqual("Line index 3 is outside the source line count 2.", failure.message);
    Assert.areEqual(3, failure.lineIndex);
    Assert.areEqual(2, failure.lineCount);
    Assert.areEqual(cause, failure.cause);
    Assert.isInstanceOf(failure, ParserException);
  }

  @TestMethod
  public acceptsExistingLines(): void {
    LineOutOfBoundsException.throwIfOutOfBounds(0, 2);
    LineOutOfBoundsException.throwIfOutOfBounds(1, 2);
  }

  @TestMethod
  public rejectsInvalidLines(): void {
    Assert.throws(() => LineOutOfBoundsException.throwIfOutOfBounds(-1, 2), LineOutOfBoundsException);
    Assert.throws(() => LineOutOfBoundsException.throwIfOutOfBounds(2, 2), LineOutOfBoundsException);
    Assert.throws(() => LineOutOfBoundsException.throwIfOutOfBounds(0.5, 2), LineOutOfBoundsException);
    Assert.throws(() => LineOutOfBoundsException.throwIfOutOfBounds(0, Number.NaN), LineOutOfBoundsException);
    Assert.throws(() => LineOutOfBoundsException.throwIfOutOfBounds(Number.MAX_SAFE_INTEGER + 1, 2), LineOutOfBoundsException);
  }
}
