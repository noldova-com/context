/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArrowFunctionNode,
  TypeScriptArrowNode,
  TypeScriptAsyncKeywordNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptParameterNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrowFunctionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const bodyNode = new TypeScriptIdentifierNode("body", new SourceSpan(0, 4));
    const node = new TypeScriptArrowFunctionNode(new SourceSpan(0, 4), undefined, bodyNode);

    Assert.isUndefined(node.arrowNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.parameterNode);
    Assert.isUndefined(node.parameterListNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.returnTypeNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptAsyncKeywordNode(new SourceSpan(1, 5))];
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(7, 1)), [], [], new SourceSpan(7, 1));
    const parameterNode = new TypeScriptParameterNode([], new SourceSpan(8, 5), new TypeScriptIdentifierNode("value", new SourceSpan(8, 5)));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(13, 1)), [], [], new SourceSpan(13, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(14, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(16, 5));
    const arrowNode = new TypeScriptArrowNode(new SourceSpan(22, 2));
    const bodyNode = new TypeScriptIdentifierNode("body", new SourceSpan(25, 4));
    const span = new SourceSpan(1, 28);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptArrowFunctionNode(
      span,
      arrowNode,
      bodyNode,
      modifierNodes,
      typeParameterListNode,
      parameterNode,
      parameterListNode,
      colonNode,
      returnTypeNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(arrowNode, node.arrowNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(parameterNode, node.parameterNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
