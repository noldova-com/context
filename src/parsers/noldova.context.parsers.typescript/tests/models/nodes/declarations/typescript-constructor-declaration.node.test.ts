/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptColonNode,
  TypeScriptConstructorDeclarationNode,
  TypeScriptConstructorKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptPublicKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConstructorDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptConstructorKeywordNode(new SourceSpan(0, 11));
    const parameterListNode = new TypeScriptParameterListNode(undefined, [], [], new SourceSpan(11, 0));
    const node = new TypeScriptConstructorDeclarationNode([], nameNode, new SourceSpan(0, 11), parameterListNode);

    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.returnTypeNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isUndefined(node.terminatorNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptPublicKeywordNode(new SourceSpan(1, 6))];
    const nameNode = new TypeScriptConstructorKeywordNode(new SourceSpan(8, 11));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(19, 1)), [], [], new SourceSpan(19, 1));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(20, 1)), [], [], new SourceSpan(20, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(21, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(23, 5));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(29, 1)), [], new SourceSpan(29, 1));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(30, 1));
    const span = new SourceSpan(1, 30);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptConstructorDeclarationNode(
      modifierNodes,
      nameNode,
      span,
      parameterListNode,
      bodyNode,
      terminatorNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
