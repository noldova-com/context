/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsExpressionNode,
  TypeScriptAsKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptSatisfiesExpressionNode,
  TypeScriptSatisfiesKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeCheckExpressionNodeTests {
  @TestMethod
  public holdsTheExpressionAndTheTypeOfEitherKind(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const typeNode = new TypeScriptIdentifierNode("Type", new SourceSpan(9, 4));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 0));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(13, 1));

    const asNode = new TypeScriptAsExpressionNode(expressionNode, new TypeScriptAsKeywordNode(new SourceSpan(6, 2)), new SourceSpan(0, 13), typeNode,
      leadingTrivia, trailingTrivia);
    const missingTypeNode = new TypeScriptMissingTypeNode(new SourceSpan(15, 0));
    const satisfiesNode = new TypeScriptSatisfiesExpressionNode(expressionNode, new TypeScriptSatisfiesKeywordNode(new SourceSpan(6, 9)),
      new SourceSpan(0, 15), missingTypeNode);

    Assert.areEqual(expressionNode, asNode.expressionNode);
    Assert.areEqual(typeNode, asNode.typeNode);
    Assert.areEqual(leadingTrivia, asNode.leadingTrivia);
    Assert.areEqual(trailingTrivia, asNode.trailingTrivia);
    Assert.areEqual(expressionNode, satisfiesNode.expressionNode);
    Assert.areEqual(missingTypeNode, satisfiesNode.typeNode);
  }
}
