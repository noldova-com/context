/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptEqualsNode,
  TypeScriptExportKeywordNode,
  TypeScriptExternalModuleReferenceNode,
  TypeScriptIdentifierNode,
  TypeScriptImportEqualsDeclarationNode,
  TypeScriptImportKeywordNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptRequireKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptStringLiteralNode,
  TypeScriptTypeKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportEqualsDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const importKeywordNode = new TypeScriptImportKeywordNode(new SourceSpan(0, 6));
    const nameNode = new TypeScriptIdentifierNode("Alias", new SourceSpan(7, 5));
    const moduleReferenceNode = new TypeScriptMissingIdentifierNode(new SourceSpan(12, 0));
    const node = new TypeScriptImportEqualsDeclarationNode(importKeywordNode, nameNode, new SourceSpan(0, 12), moduleReferenceNode);

    Assert.areEqual(moduleReferenceNode, node.moduleReferenceNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.typeKeywordNode);
    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptExportKeywordNode(new SourceSpan(1, 6))];
    const importKeywordNode = new TypeScriptImportKeywordNode(new SourceSpan(8, 6));
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(15, 4));
    const nameNode = new TypeScriptIdentifierNode("Alias", new SourceSpan(20, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(26, 1));
    const moduleReferenceNode = new TypeScriptExternalModuleReferenceNode(new TypeScriptRequireKeywordNode(new SourceSpan(28, 7)), new SourceSpan(28, 7),
      new TypeScriptOpenParenthesisNode(new SourceSpan(35, 1)), new TypeScriptStringLiteralNode('"m"', new SourceSpan(36, 3)));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(35, 1));
    const span = new SourceSpan(1, 35);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportEqualsDeclarationNode(
      importKeywordNode,
      nameNode,
      span,
      moduleReferenceNode,
      equalsNode,
      typeKeywordNode,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(importKeywordNode, node.importKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(moduleReferenceNode, node.moduleReferenceNode);
    Assert.areEqual(typeKeywordNode, node.typeKeywordNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
