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
  TypeScriptEqualsNode,
  TypeScriptExclamationNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptVariableDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVariableDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(0, 0));
    const node = new TypeScriptVariableDeclarationNode(new SourceSpan(0, 0), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.exclamationNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.typeNode);
    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.initializerNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(6, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(7, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(9, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(15, 1));
    const initializerNode = new TypeScriptIdentifierNode("initializer", new SourceSpan(17, 11));
    const span = new SourceSpan(1, 27);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptVariableDeclarationNode(
      span,
      nameNode,
      exclamationNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
