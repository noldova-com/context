/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptAtNode, TypeScriptDecoratorNode, TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDecoratorNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const atNode = new TypeScriptAtNode(new SourceSpan(1, 1));
    const expressionNode = new TypeScriptIdentifierNode("decorator", new SourceSpan(2, 9));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(11, 1));
    const node = new TypeScriptDecoratorNode(atNode, new SourceSpan(1, 10), expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(atNode, node.atNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
