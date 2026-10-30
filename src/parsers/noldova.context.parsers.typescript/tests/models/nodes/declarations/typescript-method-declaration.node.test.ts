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
  TypeScriptAsyncKeywordNode,
  TypeScriptBlockNode,
  TypeScriptColonNode,
  TypeScriptExclamationNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptQuestionNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMethodDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(0, 0));
    const parameterListNode = new TypeScriptParameterListNode(undefined, [], [], new SourceSpan(0, 0));
    const node = new TypeScriptMethodDeclarationNode([], new SourceSpan(0, 0), nameNode, parameterListNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.isUndefined(node.asteriskNode);
    Assert.isUndefined(node.questionNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.returnTypeNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isUndefined(node.terminatorNode);
    Assert.isUndefined(node.exclamationNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptAsyncKeywordNode(new SourceSpan(1, 5))];
    const asteriskNode = new TypeScriptAsteriskNode(new SourceSpan(7, 1));
    const nameNode = new TypeScriptIdentifierNode("method", new SourceSpan(8, 6));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(14, 1));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(15, 1));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(16, 1)), [], [], new SourceSpan(16, 1));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(17, 1)), [], [], new SourceSpan(17, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(18, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(20, 5));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(26, 1)), [], new SourceSpan(26, 1));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(27, 1));
    const span = new SourceSpan(1, 27);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptMethodDeclarationNode(
      modifierNodes,
      span,
      nameNode,
      parameterListNode,
      asteriskNode,
      questionNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      bodyNode,
      terminatorNode,
      exclamationNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(asteriskNode, node.asteriskNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
