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
  TypeScriptColonNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptImportAttributeNode,
  TypeScriptImportAttributesNode,
  TypeScriptOpenBraceNode,
  TypeScriptStringLiteralNode,
  TypeScriptWithKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportAttributesNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const node = new TypeScriptImportAttributesNode(undefined, [], [], new SourceSpan(0, 0));

    Assert.isUndefined(node.keywordNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const keywordNode = new TypeScriptWithKeywordNode(new SourceSpan(1, 4));
    const colonNode = new TypeScriptColonNode(new SourceSpan(5, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(7, 1));
    const memberNodes = [new TypeScriptImportAttributeNode(new SourceSpan(9, 12), new TypeScriptIdentifierNode("type", new SourceSpan(9, 4)),
      new TypeScriptStringLiteralNode('"json"', new SourceSpan(15, 6)))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(21, 1))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(23, 1));
    const span = new SourceSpan(1, 23);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportAttributesNode(
      keywordNode,
      memberNodes,
      commaNodes,
      span,
      openBraceNode,
      closeBraceNode,
      colonNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(keywordNode, node.keywordNode);
    Assert.areEqual(memberNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
