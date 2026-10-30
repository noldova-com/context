/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsKeywordNode,
  TypeScriptExportSpecifierNode,
  TypeScriptIdentifierNode,
  TypeScriptTypeKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExportSpecifierNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const node = new TypeScriptExportSpecifierNode(new SourceSpan(0, 5), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.typeKeywordNode);
    Assert.isUndefined(node.asKeywordNode);
    Assert.isUndefined(node.aliasNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(1, 4));
    const nameNode = new TypeScriptIdentifierNode("source", new SourceSpan(6, 6));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(13, 2));
    const aliasNode = new TypeScriptIdentifierNode("target", new SourceSpan(16, 6));
    const span = new SourceSpan(1, 21);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExportSpecifierNode(span, nameNode, asKeywordNode, aliasNode, typeKeywordNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(aliasNode, node.aliasNode);
    Assert.areEqual(typeKeywordNode, node.typeKeywordNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
