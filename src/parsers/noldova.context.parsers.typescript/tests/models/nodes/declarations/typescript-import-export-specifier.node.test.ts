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
  TypeScriptIdentifierNode,
  TypeScriptImportSpecifierNode,
  TypeScriptTypeKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportExportSpecifierNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const node = new TypeScriptImportSpecifierNode(new SourceSpan(0, 5), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.asKeywordNode);
    Assert.isUndefined(node.aliasNode);
    Assert.isUndefined(node.typeKeywordNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const typeKeywordNode = new TypeScriptTypeKeywordNode(new SourceSpan(1, 4));
    const nameNode = new TypeScriptIdentifierNode("source", new SourceSpan(6, 6));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(13, 2));
    const aliasNode = new TypeScriptIdentifierNode("local", new SourceSpan(16, 5));
    const span = new SourceSpan(1, 20);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportSpecifierNode(span, nameNode, asKeywordNode, aliasNode, typeKeywordNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(aliasNode, node.aliasNode);
    Assert.areEqual(typeKeywordNode, node.typeKeywordNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
