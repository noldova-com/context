/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptExternalModuleReferenceNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptRequireKeywordNode,
  TypeScriptStringLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExternalModuleReferenceNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const requireKeywordNode = new TypeScriptRequireKeywordNode(new SourceSpan(0, 7));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(7, 1));
    const moduleSpecifierNode = new TypeScriptMissingExpressionNode(new SourceSpan(8, 0));
    const node = new TypeScriptExternalModuleReferenceNode(requireKeywordNode, new SourceSpan(0, 8), openParenthesisNode, moduleSpecifierNode);

    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(moduleSpecifierNode, node.moduleSpecifierNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const requireKeywordNode = new TypeScriptRequireKeywordNode(new SourceSpan(1, 7));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(8, 1));
    const moduleSpecifierNode = new TypeScriptStringLiteralNode('"pkg"', new SourceSpan(9, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(14, 1));
    const span = new SourceSpan(1, 14);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExternalModuleReferenceNode(
      requireKeywordNode,
      span,
      openParenthesisNode,
      moduleSpecifierNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(requireKeywordNode, node.requireKeywordNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(moduleSpecifierNode, node.moduleSpecifierNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
