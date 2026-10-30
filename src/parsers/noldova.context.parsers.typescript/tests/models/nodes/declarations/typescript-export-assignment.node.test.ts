/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptDeclareKeywordNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptExportAssignmentNode,
  TypeScriptExportKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExportAssignmentNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(0, 6));
    const assignmentTokenNode = new TypeScriptDefaultKeywordNode(new SourceSpan(7, 7));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(15, 5));
    const node = new TypeScriptExportAssignmentNode(exportKeywordNode, assignmentTokenNode, expressionNode, new SourceSpan(0, 20));

    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(9, 6));
    const assignmentTokenNode = new TypeScriptDefaultKeywordNode(new SourceSpan(16, 7));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(24, 5));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(29, 1));
    const span = new SourceSpan(1, 29);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExportAssignmentNode(
      exportKeywordNode,
      assignmentTokenNode,
      expressionNode,
      span,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(exportKeywordNode, node.exportKeywordNode);
    Assert.areEqual(assignmentTokenNode, node.assignmentTokenNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
