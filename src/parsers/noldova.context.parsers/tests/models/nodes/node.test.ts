/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EndOfFileNode, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class NodeTests {
  @TestMethod
  public constructorPreservesSpanAndTrivia(): void {
    const span = new SourceSpan(2, 0);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(1, 1));
    const trailingTrivia = new WhitespaceNode("\n", new SourceSpan(2, 1));
    const node = new EndOfFileNode(span, leadingTrivia, trailingTrivia);

    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
