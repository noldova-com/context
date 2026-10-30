/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsteriskNode,
  TypeScriptDeclareKeywordNode,
  TypeScriptExportDeclarationNode,
  TypeScriptExportKeywordNode,
  TypeScriptFromKeywordNode,
  TypeScriptImportAttributesNode,
  TypeScriptNamespaceExportNode,
  TypeScriptSemicolonNode,
  TypeScriptStringLiteralNode,
  TypeScriptTypeKeywordNode,
  TypeScriptWithKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExportDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(0, 6));
    const exportClauseNode = new TypeScriptNamespaceExportNode(new TypeScriptAsteriskNode(new SourceSpan(7, 1)), new SourceSpan(7, 1));
    const node = new TypeScriptExportDeclarationNode(exportKeywordNode, new SourceSpan(0, 8), exportClauseNode);

    Assert.areEqual(exportClauseNode, node.exportClauseNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.typeKeywordNode);
    Assert.isUndefined(node.fromKeywordNode);
    Assert.isUndefined(node.moduleSpecifierNode);
    Assert.isUndefined(node.attributesNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const exportKeywordNode = new TypeScriptExportKeywordNode(new SourceSpan(9, 6));
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(16, 4));
    const exportClauseNode = new TypeScriptNamespaceExportNode(new TypeScriptAsteriskNode(new SourceSpan(21, 1)), new SourceSpan(21, 1));
    const fromKeywordNode = new TypeScriptFromKeywordNode(new SourceSpan(23, 4));
    const moduleSpecifierNode = new TypeScriptStringLiteralNode('"pkg"', new SourceSpan(28, 5));
    const attributesNode = new TypeScriptImportAttributesNode(new TypeScriptWithKeywordNode(new SourceSpan(34, 4)), [], [], new SourceSpan(34, 4));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(38, 1));
    const span = new SourceSpan(1, 38);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExportDeclarationNode(
      exportKeywordNode,
      span,
      exportClauseNode,
      typeKeywordNode,
      fromKeywordNode,
      moduleSpecifierNode,
      attributesNode,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(exportKeywordNode, node.exportKeywordNode);
    Assert.areEqual(typeKeywordNode, node.typeKeywordNode);
    Assert.areEqual(exportClauseNode, node.exportClauseNode);
    Assert.areEqual(fromKeywordNode, node.fromKeywordNode);
    Assert.areEqual(moduleSpecifierNode, node.moduleSpecifierNode);
    Assert.areEqual(attributesNode, node.attributesNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
