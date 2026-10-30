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
  TypeScriptFunctionExpressionNode,
  TypeScriptFunctionKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptFunctionExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const functionKeywordNode = new TypeScriptFunctionKeywordNode(new SourceSpan(0, 8));
    const parameterListNode = new TypeScriptParameterListNode(undefined, [], [], new SourceSpan(8, 0));
    const node = new TypeScriptFunctionExpressionNode(functionKeywordNode, new SourceSpan(0, 8), parameterListNode);

    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.asteriskNode);
    Assert.isUndefined(node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.returnTypeNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptAsyncKeywordNode(new SourceSpan(1, 5))];
    const functionKeywordNode = new TypeScriptFunctionKeywordNode(new SourceSpan(7, 8));
    const asteriskNode = new TypeScriptAsteriskNode(new SourceSpan(15, 1));
    const nameNode = new TypeScriptIdentifierNode("ready", new SourceSpan(17, 5));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(22, 1)), [], [], new SourceSpan(22, 1));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(23, 1)), [], [], new SourceSpan(23, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(24, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(26, 6));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(33, 1)), [], new SourceSpan(33, 1));
    const span = new SourceSpan(1, 33);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptFunctionExpressionNode(
      functionKeywordNode,
      span,
      parameterListNode,
      modifierNodes,
      asteriskNode,
      nameNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      bodyNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(functionKeywordNode, node.functionKeywordNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(asteriskNode, node.asteriskNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
