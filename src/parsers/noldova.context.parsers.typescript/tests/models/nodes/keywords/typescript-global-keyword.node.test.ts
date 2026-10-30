/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptGlobalKeywordNode, TypeScriptLineCommentNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptGlobalKeywordNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const node = new TypeScriptGlobalKeywordNode(new SourceSpan(0, 6));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesKeywordSpanAndTrivia(): void {
    const leadingTrivia = new TypeScriptLineCommentNode(" leading", new SourceSpan(0, 10));
    const span = new SourceSpan(10, 6);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptGlobalKeywordNode(span, leadingTrivia, trailingTrivia);

    Assert.areEqual("global", node.value);
    Assert.areEqual(span, node.span);
    Assert.areEqual<Node | undefined>(leadingTrivia, node.leadingTrivia);
    Assert.areEqual<Node | undefined>(trailingTrivia, node.trailingTrivia);
  }
}
