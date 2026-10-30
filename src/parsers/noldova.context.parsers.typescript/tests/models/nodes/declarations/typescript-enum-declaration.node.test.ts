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
  TypeScriptCommaNode,
  TypeScriptConstKeywordNode,
  TypeScriptEnumDeclarationNode,
  TypeScriptEnumKeywordNode,
  TypeScriptEnumMemberNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptEnumDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const enumKeywordNode = new TypeScriptEnumKeywordNode(new SourceSpan(0, 4));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(4, 0));
    const node = new TypeScriptEnumDeclarationNode(enumKeywordNode, [], [], new SourceSpan(0, 4), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptConstKeywordNode(new SourceSpan(1, 5))];
    const enumKeywordNode = new TypeScriptEnumKeywordNode(new SourceSpan(7, 4));
    const nameNode = new TypeScriptIdentifierNode("Color", new SourceSpan(12, 5));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(18, 1));
    const memberNodes = [new TypeScriptEnumMemberNode(new TypeScriptIdentifierNode("Red", new SourceSpan(20, 3)), new SourceSpan(20, 3))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(23, 1))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(25, 1));
    const span = new SourceSpan(1, 25);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptEnumDeclarationNode(
      enumKeywordNode,
      memberNodes,
      commaNodes,
      span,
      nameNode,
      openBraceNode,
      closeBraceNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(enumKeywordNode, node.enumKeywordNode);
    Assert.areEqual(memberNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
