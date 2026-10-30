/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { EndOfFileNode, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EndOfFileNodeTests {
  @TestMethod
  public constructorCreatesZeroLengthMarker(): void {
    const span = new SourceSpan(5, 0);
    const node = new EndOfFileNode(span);

    Assert.areEqual(span, node.span);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorRejectsANonEmptySpan(): void {
    const failure = Assert.throws(() => new EndOfFileNode(new SourceSpan(5, 1)), ArgumentException);

    Assert.areEqual("span", failure.parameterName);
  }
}
