/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptInstanceOfKeywordNode, TypeScriptLineCommentNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptInstanceOfKeywordNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const node = new TypeScriptInstanceOfKeywordNode(new SourceSpan(0, 10));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesKeywordSpanAndTrivia(): void {
    const leadingTrivia = new TypeScriptLineCommentNode(" leading", new SourceSpan(0, 10));
    const span = new SourceSpan(10, 10);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptInstanceOfKeywordNode(span, leadingTrivia, trailingTrivia);

    Assert.areEqual("instanceof", node.value);
    Assert.areEqual(span, node.span);
    Assert.areEqual<Node | undefined>(leadingTrivia, node.leadingTrivia);
    Assert.areEqual<Node | undefined>(trailingTrivia, node.trailingTrivia);
  }
}
