/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBracketNode,
  TypeScriptComputedPropertyNameNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptComputedPropertyNameNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(1, 1));
    const expressionNode = new TypeScriptIdentifierNode("key", new SourceSpan(2, 3));
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(5, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(6, 1));
    const node = new TypeScriptComputedPropertyNameNode(
      openBracketNode,
      new SourceSpan(1, 5),
      expressionNode,
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
