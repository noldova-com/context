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
  TypeScriptLetKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptVariableDeclarationListNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVariableStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const declarationListNode = new TypeScriptVariableDeclarationListNode(new TypeScriptLetKeywordNode(new SourceSpan(0, 3)), [], [], new SourceSpan(0, 3));
    const node = new TypeScriptVariableStatementNode(declarationListNode, new SourceSpan(0, 3));

    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const declarationListNode = new TypeScriptVariableDeclarationListNode(new TypeScriptLetKeywordNode(new SourceSpan(9, 3)), [], [], new SourceSpan(9, 3));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(12, 1));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptVariableStatementNode(declarationListNode, span, semicolonNode, modifierNodes, leadingTrivia, trailingTrivia);

    Assert.areEqual(declarationListNode, node.declarationListNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
