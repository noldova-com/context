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
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeKeywordNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeAliasDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(0, 4));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(4, 0));
    const typeNode = new TypeScriptMissingTypeNode(new SourceSpan(4, 0));
    const node = new TypeScriptTypeAliasDeclarationNode(typeKeywordNode, new SourceSpan(0, 4), nameNode, typeNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptExportKeywordNode(new SourceSpan(1, 6))];
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(8, 4));
    const nameNode = new TypeScriptIdentifierNode("Value", new SourceSpan(13, 5));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(18, 1)), [], [], new SourceSpan(18, 1));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(20, 1));
    const typeNode = new TypeScriptIdentifierNode("Target", new SourceSpan(22, 6));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(28, 1));
    const span = new SourceSpan(1, 28);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTypeAliasDeclarationNode(
      typeKeywordNode,
      span,
      nameNode,
      typeNode,
      typeParameterListNode,
      equalsNode,
      semicolonNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(typeKeywordNode, node.typeKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
