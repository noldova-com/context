/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptThisKeywordNode, TypeScriptThisTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptThisTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const thisKeywordNode = new TypeScriptThisKeywordNode(new SourceSpan(1, 4));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(5, 1));
    const node = new TypeScriptThisTypeNode(thisKeywordNode, thisKeywordNode.span, leadingTrivia, trailingTrivia);

    Assert.areEqual(thisKeywordNode, node.thisKeywordNode);
    Assert.areEqual(thisKeywordNode.span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
