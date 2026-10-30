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
  TypeScriptIdentifierNode,
  TypeScriptImportAttributeNode,
  TypeScriptMissingExpressionNode,
  TypeScriptStringLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportAttributeNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptIdentifierNode("type", new SourceSpan(0, 4));
    const valueNode = new TypeScriptMissingExpressionNode(new SourceSpan(4, 0));
    const node = new TypeScriptImportAttributeNode(new SourceSpan(0, 4), nameNode, valueNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(valueNode, node.valueNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const nameNode = new TypeScriptIdentifierNode("type", new SourceSpan(1, 4));
    const colonNode = new TypeScriptColonNode(new SourceSpan(5, 1));
    const valueNode = new TypeScriptStringLiteralNode('"json"', new SourceSpan(7, 6));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportAttributeNode(span, nameNode, valueNode, colonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(valueNode, node.valueNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
