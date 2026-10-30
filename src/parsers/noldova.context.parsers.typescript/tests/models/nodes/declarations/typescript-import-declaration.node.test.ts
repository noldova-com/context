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
  TypeScriptFromKeywordNode,
  TypeScriptImportAttributesNode,
  TypeScriptImportClauseNode,
  TypeScriptImportDeclarationNode,
  TypeScriptImportKeywordNode,
  TypeScriptMissingExpressionNode,
  TypeScriptSemicolonNode,
  TypeScriptStringLiteralNode,
  TypeScriptTypeKeywordNode,
  TypeScriptWithKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const importKeywordNode = new TypeScriptImportKeywordNode(new SourceSpan(0, 6));
    const moduleSpecifierNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const node = new TypeScriptImportDeclarationNode(importKeywordNode, new SourceSpan(0, 6), moduleSpecifierNode);

    Assert.areEqual(moduleSpecifierNode, node.moduleSpecifierNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.phaseKeywordNode);
    Assert.isUndefined(node.importClauseNode);
    Assert.isUndefined(node.fromKeywordNode);
    Assert.isUndefined(node.attributesNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptDeclareKeywordNode(new SourceSpan(1, 7))];
    const importKeywordNode = new TypeScriptImportKeywordNode(new SourceSpan(9, 6));
    const phaseKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(16, 4));
    const importClauseNode = new TypeScriptImportClauseNode(new SourceSpan(21, 4));
    const fromKeywordNode = new TypeScriptFromKeywordNode(new SourceSpan(26, 4));
    const moduleSpecifierNode = new TypeScriptStringLiteralNode('"pkg"', new SourceSpan(31, 5));
    const attributesNode = new TypeScriptImportAttributesNode(new TypeScriptWithKeywordNode(new SourceSpan(37, 4)), [], [], new SourceSpan(37, 4));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(41, 1));
    const span = new SourceSpan(1, 41);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportDeclarationNode(
      importKeywordNode,
      span,
      moduleSpecifierNode,
      phaseKeywordNode,
      importClauseNode,
      fromKeywordNode,
      attributesNode,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(importKeywordNode, node.importKeywordNode);
    Assert.areEqual(phaseKeywordNode, node.phaseKeywordNode);
    Assert.areEqual(importClauseNode, node.importClauseNode);
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
