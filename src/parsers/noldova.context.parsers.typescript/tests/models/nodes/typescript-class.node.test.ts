/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAbstractKeywordNode,
  TypeScriptClassBodyNode,
  TypeScriptClassExpressionNode,
  TypeScriptClassKeywordNode,
  TypeScriptCloseBraceNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptGreaterThanNode,
  TypeScriptHeritageClauseNode,
  TypeScriptIdentifierNode,
  TypeScriptImplementsKeywordNode,
  TypeScriptLessThanNode,
  TypeScriptOpenBraceNode,
  TypeScriptTypeParameterListNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptClassNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const classKeywordNode = new TypeScriptClassKeywordNode(new SourceSpan(0, 5));
    const bodyNode = new TypeScriptClassBodyNode(undefined, [], new SourceSpan(5, 0));
    const node = new TypeScriptClassExpressionNode(classKeywordNode, [], new SourceSpan(0, 5), bodyNode);

    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.isUndefined(node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptAbstractKeywordNode(new SourceSpan(1, 8))];
    const classKeywordNode = new TypeScriptClassKeywordNode(new SourceSpan(10, 5));
    const nameNode = new TypeScriptIdentifierNode("Box", new SourceSpan(16, 3));
    const typeParameterNode = new TypeScriptTypeParameterNode([], new TypeScriptIdentifierNode("T", new SourceSpan(20, 1)), new SourceSpan(20, 1));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(
      new TypeScriptLessThanNode(new SourceSpan(19, 1)),
      [typeParameterNode],
      [],
      new SourceSpan(19, 3),
      new TypeScriptGreaterThanNode(new SourceSpan(21, 1)));
    const extendsClauseNode = new TypeScriptHeritageClauseNode(
      new TypeScriptExtendsKeywordNode(new SourceSpan(23, 7)),
      [new TypeScriptIdentifierNode("Base", new SourceSpan(31, 4))],
      [],
      new SourceSpan(23, 12));
    const implementsClauseNode = new TypeScriptHeritageClauseNode(
      new TypeScriptImplementsKeywordNode(new SourceSpan(36, 10)),
      [new TypeScriptIdentifierNode("Contract", new SourceSpan(47, 8))],
      [],
      new SourceSpan(36, 19));
    const heritageClauseNodes = [extendsClauseNode, implementsClauseNode];
    const bodyNode = new TypeScriptClassBodyNode(
      new TypeScriptOpenBraceNode(new SourceSpan(56, 1)),
      [],
      new SourceSpan(56, 2),
      new TypeScriptCloseBraceNode(new SourceSpan(57, 1)));
    const span = new SourceSpan(1, 57);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptClassExpressionNode(
      classKeywordNode,
      heritageClauseNodes,
      span,
      bodyNode,
      nameNode,
      typeParameterListNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(classKeywordNode, node.classKeywordNode);
    Assert.areEqual(heritageClauseNodes, node.heritageClauseNodes);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeParameterListNode, node.typeParameterListNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
