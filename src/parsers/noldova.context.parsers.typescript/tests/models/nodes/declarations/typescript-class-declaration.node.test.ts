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
  TypeScriptClassDeclarationNode,
  TypeScriptClassKeywordNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptHeritageClauseNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenBraceNode,
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptClassDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const classKeywordNode = new TypeScriptClassKeywordNode(new SourceSpan(0, 5));
    const bodyNode = new TypeScriptClassBodyNode(undefined, [], new SourceSpan(5, 0));
    const node = new TypeScriptClassDeclarationNode(classKeywordNode, [], new SourceSpan(0, 5), bodyNode);

    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptAbstractKeywordNode(new SourceSpan(1, 8))];
    const classKeywordNode = new TypeScriptClassKeywordNode(new SourceSpan(10, 5));
    const nameNode = new TypeScriptIdentifierNode("Box", new SourceSpan(16, 3));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(19, 1)), [], [], new SourceSpan(19, 1));
    const heritageClauseNodes = [new TypeScriptHeritageClauseNode(new TypeScriptExtendsKeywordNode(new SourceSpan(21, 7)), [], [], new SourceSpan(21, 7))];
    const bodyNode = new TypeScriptClassBodyNode(new TypeScriptOpenBraceNode(new SourceSpan(29, 1)), [], new SourceSpan(29, 1));
    const span = new SourceSpan(1, 29);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptClassDeclarationNode(
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
