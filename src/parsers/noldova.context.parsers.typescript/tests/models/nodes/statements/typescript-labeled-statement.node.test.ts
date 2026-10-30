/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptColonNode, TypeScriptIdentifierNode, TypeScriptLabeledStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptLabeledStatementNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const labelNode = new TypeScriptIdentifierNode("label", new SourceSpan(0, 5));
    const colonNode = new TypeScriptColonNode(new SourceSpan(5, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(7, 9));
    const node = new TypeScriptLabeledStatementNode(labelNode, colonNode, statementNode, new SourceSpan(0, 16));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const labelNode = new TypeScriptIdentifierNode("label", new SourceSpan(1, 5));
    const colonNode = new TypeScriptColonNode(new SourceSpan(6, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(8, 9));
    const span = new SourceSpan(1, 16);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptLabeledStatementNode(labelNode, colonNode, statementNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(labelNode, node.labelNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
