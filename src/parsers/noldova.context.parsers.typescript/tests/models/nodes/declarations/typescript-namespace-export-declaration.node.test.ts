/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsKeywordNode,
  TypeScriptDeclareKeywordNode,
  TypeScriptExportKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamespaceExportDeclarationNode,
  TypeScriptNamespaceKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNamespaceExportDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(0, 6));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(7, 2));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(9, 0));
    const node = new TypeScriptNamespaceExportDeclarationNode(exportKeywordNode, new SourceSpan(0, 9), asKeywordNode, nameNode);

    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.namespaceKeywordNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(9, 6));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(16, 2));
    const namespaceKeywordNode = new TypeScriptNamespaceKeywordNode(new SourceSpan(19, 9));
    const nameNode = new TypeScriptIdentifierNode("Library", new SourceSpan(29, 7));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(36, 1));
    const span = new SourceSpan(1, 36);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNamespaceExportDeclarationNode(
      exportKeywordNode,
      span,
      asKeywordNode,
      nameNode,
      namespaceKeywordNode,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(exportKeywordNode, node.exportKeywordNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(namespaceKeywordNode, node.namespaceKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
