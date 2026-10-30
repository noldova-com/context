/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { InvalidOffsetException, ParserException } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class InvalidOffsetExceptionTests {
  @TestMethod
  public carriesTheInvalidOffset(): void {
    const cause = new Error("cause");
    const failure = new InvalidOffsetException(6, 1, 5, new ExceptionOptions(cause));

    Assert.areEqual("Offset 6 is outside the permitted range from 1 through 5.", failure.message);
    Assert.areEqual(6, failure.offset);
    Assert.areEqual(1, failure.minimumOffset);
    Assert.areEqual(5, failure.maximumOffset);
    Assert.areEqual(cause, failure.cause);
    Assert.isInstanceOf(failure, ParserException);
  }

  @TestMethod
  public acceptsTheCompleteOffsetRange(): void {
    InvalidOffsetException.throwIfOutsideRange(1, 1, 5);
    InvalidOffsetException.throwIfOutsideRange(5, 1, 5);
  }

  @TestMethod
  public rejectsInvalidOffsets(): void {
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(0, 1, 5), InvalidOffsetException);
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(6, 1, 5), InvalidOffsetException);
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(1.5, 1, 5), InvalidOffsetException);
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(1, Number.NaN, 5), InvalidOffsetException);
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(1, 5, 1), InvalidOffsetException);
    Assert.throws(() => InvalidOffsetException.throwIfOutsideRange(Number.MAX_SAFE_INTEGER + 1, 1, 5), InvalidOffsetException);
  }
}
