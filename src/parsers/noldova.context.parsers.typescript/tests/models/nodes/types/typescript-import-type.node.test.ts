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
  TypeScriptCloseParenthesisNode,
  TypeScriptCommaNode,
  TypeScriptDotNode,
  TypeScriptIdentifierNode,
  TypeScriptImportAttributesNode,
  TypeScriptImportKeywordNode,
  TypeScriptImportTypeNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptStringLiteralNode,
  TypeScriptTypeOfKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const typeOfKeywordNode = new TypeScriptTypeOfKeywordNode(new SourceSpan(1, 6));
    const importKeywordNode = new TypeScriptImportKeywordNode(new SourceSpan(8, 6));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(14, 1));
    const argumentNode = new TypeScriptStringLiteralNode("module", new SourceSpan(15, 8));
    const commaNode = new TypeScriptCommaNode(new SourceSpan(23, 1));
    const attributesOpenBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(25, 1));
    const attributesNode = new TypeScriptImportAttributesNode(undefined, [], [], new SourceSpan(27, 8));
    const attributesCommaNode = new TypeScriptCommaNode(new SourceSpan(35, 1));
    const attributesCloseBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(37, 1));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(38, 1));
    const dotNode = new TypeScriptDotNode(new SourceSpan(39, 1));
    const qualifierNode = new TypeScriptIdentifierNode("Export", new SourceSpan(40, 6));
    const span = new SourceSpan(1, 45);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(46, 1));
    const node = new TypeScriptImportTypeNode(
      importKeywordNode,
      span,
      argumentNode,
      typeOfKeywordNode,
      openParenthesisNode,
      commaNode,
      attributesOpenBraceNode,
      attributesNode,
      attributesCommaNode,
      attributesCloseBraceNode,
      closeParenthesisNode,
      dotNode,
      qualifierNode,
      undefined,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(typeOfKeywordNode, node.typeOfKeywordNode);
    Assert.areEqual(importKeywordNode, node.importKeywordNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(argumentNode, node.argumentNode);
    Assert.areEqual(commaNode, node.commaNode);
    Assert.areEqual(attributesOpenBraceNode, node.attributesOpenBraceNode);
    Assert.areEqual(attributesNode, node.attributesNode);
    Assert.areEqual(attributesCommaNode, node.attributesCommaNode);
    Assert.areEqual(attributesCloseBraceNode, node.attributesCloseBraceNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(dotNode, node.dotNode);
    Assert.areEqual(qualifierNode, node.qualifierNode);
    Assert.isUndefined(node.typeArgumentListNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
