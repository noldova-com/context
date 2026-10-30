/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptDeclareKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptModuleDeclarationNode,
  TypeScriptNamespaceKeywordNode,
  TypeScriptOpenBraceNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptModuleDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const keywordNode = new TypeScriptNamespaceKeywordNode(new SourceSpan(0, 9));
    const node = new TypeScriptModuleDeclarationNode(keywordNode, new SourceSpan(0, 9));

    Assert.isUndefined(node.nameNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const keywordNode = new TypeScriptNamespaceKeywordNode(new SourceSpan(9, 9));
    const nameNode = new TypeScriptIdentifierNode("Library", new SourceSpan(19, 7));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(27, 1)), [], new SourceSpan(27, 1));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(28, 1));
    const span = new SourceSpan(1, 28);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptModuleDeclarationNode(keywordNode, span, nameNode, bodyNode, semicolonNode, modifierNodes, leadingTrivia, trailingTrivia);

    Assert.areEqual(keywordNode, node.keywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
