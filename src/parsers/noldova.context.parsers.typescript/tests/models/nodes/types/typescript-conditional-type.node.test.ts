/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptColonNode,
  TypeScriptConditionalTypeNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptQuestionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConditionalTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const checkTypeNode = new TypeScriptIdentifierNode("T", new SourceSpan(1, 1));
    const extendsKeywordNode = new TypeScriptExtendsKeywordNode(new SourceSpan(3, 7));
    const extendsTypeNode = new TypeScriptIdentifierNode("U", new SourceSpan(11, 1));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(13, 1));
    const trueTypeNode = new TypeScriptIdentifierNode("A", new SourceSpan(15, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(17, 1));
    const falseTypeNode = new TypeScriptIdentifierNode("B", new SourceSpan(19, 1));
    const span = new SourceSpan(1, 19);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(20, 1));
    const node = new TypeScriptConditionalTypeNode(
      checkTypeNode,
      extendsKeywordNode,
      span,
      extendsTypeNode,
      trueTypeNode,
      falseTypeNode,
      questionNode,
      colonNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(checkTypeNode, node.checkTypeNode);
    Assert.areEqual(extendsKeywordNode, node.extendsKeywordNode);
    Assert.areEqual(extendsTypeNode, node.extendsTypeNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(trueTypeNode, node.trueTypeNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(falseTypeNode, node.falseTypeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
