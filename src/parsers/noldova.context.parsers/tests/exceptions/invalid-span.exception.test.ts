/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { InvalidSpanException, ParserException } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class InvalidSpanExceptionTests {
  @TestMethod
  public carriesTheInvalidSpan(): void {
    const cause = new Error("cause");
    const failure = new InvalidSpanException(4, 3, 5, new ExceptionOptions(cause));

    Assert.areEqual("Span [4, 7) is outside the source length 5.", failure.message);
    Assert.areEqual(4, failure.startOffset);
    Assert.areEqual(3, failure.length);
    Assert.areEqual(5, failure.sourceLength);
    Assert.areEqual(cause, failure.cause);
    Assert.isInstanceOf(failure, ParserException);
  }

  @TestMethod
  public acceptsContainedAndEmptySpans(): void {
    InvalidSpanException.throwIfInvalid(0, 5, 5);
    InvalidSpanException.throwIfInvalid(5, 0, 5);
  }

  @TestMethod
  public rejectsInvalidSpans(): void {
    Assert.throws(() => InvalidSpanException.throwIfInvalid(-1, 0, 5), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(1.5, 2, 5), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(1, 2.5, 5), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(3, -1, 5), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(0, 6, 5), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(0, 0, Number.NaN), InvalidSpanException);
    Assert.throws(() => InvalidSpanException.throwIfInvalid(Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER), InvalidSpanException);
  }
}
