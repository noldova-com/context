/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptDotDotDotNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptSpreadAssignmentNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSpreadAssignmentNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const dotDotDotNode = new TypeScriptDotDotDotNode(new SourceSpan(0, 3));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(3, 0));
    const node = new TypeScriptSpreadAssignmentNode(dotDotDotNode, new SourceSpan(0, 3), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const dotDotDotNode = new TypeScriptDotDotDotNode(new SourceSpan(1, 3));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(4, 5));
    const span = new SourceSpan(1, 8);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptSpreadAssignmentNode(dotDotDotNode, span, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(dotDotDotNode, node.dotDotDotNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
