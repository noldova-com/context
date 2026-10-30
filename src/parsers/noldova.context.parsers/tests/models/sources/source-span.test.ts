/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SourceSpanTests {
  @TestMethod
  public carriesOnlyTheCanonicalSpan(): void {
    const span = new SourceSpan(3, 4);

    Assert.areEqual(3, span.startOffset);
    Assert.areEqual(4, span.length);
    Assert.areEqual(7, span.endOffset);
    Assert.isFalse(span.isEmpty);
  }

  @TestMethod
  public representsAnEmptySpan(): void {
    const span = new SourceSpan(3, 0);

    Assert.areEqual(3, span.endOffset);
    Assert.isTrue(span.isEmpty);
  }
}
