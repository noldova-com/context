/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBraceNode,
  TypeScriptExportKeywordNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptHeritageClauseNode,
  TypeScriptIdentifierNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptInterfaceKeywordNode,
  TypeScriptLessThanNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptOpenBraceNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptInterfaceDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const interfaceKeywordNode = new TypeScriptInterfaceKeywordNode(new SourceSpan(0, 9));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(9, 0));
    const node = new TypeScriptInterfaceDeclarationNode(interfaceKeywordNode, [], [], new SourceSpan(0, 9), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptExportKeywordNode(new SourceSpan(1, 6))];
    const interfaceKeywordNode = new TypeScriptInterfaceKeywordNode(new SourceSpan(8, 9));
    const nameNode = new TypeScriptIdentifierNode("Box", new SourceSpan(18, 3));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(21, 1)), [], [], new SourceSpan(21, 1));
    const heritageClauseNodes = [new TypeScriptHeritageClauseNode(new TypeScriptExtendsKeywordNode(new SourceSpan(23, 7)), [], [], new SourceSpan(23, 7))];
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(31, 1));
    const memberNodes = [new TypeScriptIdentifierNode("member", new SourceSpan(33, 6))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(40, 1));
    const span = new SourceSpan(1, 40);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptInterfaceDeclarationNode(
      interfaceKeywordNode,
      memberNodes,
      heritageClauseNodes,
      span,
      nameNode,
      typeParameterListNode,
      openBraceNode,
      closeBraceNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(interfaceKeywordNode, node.interfaceKeywordNode);
    Assert.areEqual(memberNodes, node.children);
    Assert.areEqual(heritageClauseNodes, node.heritageClauseNodes);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
