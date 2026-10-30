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
  TypeScriptAsteriskNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamespaceImportNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNamespaceImportNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const asteriskNode = new TypeScriptAsteriskNode(new SourceSpan(0, 1));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(1, 0));
    const node = new TypeScriptNamespaceImportNode(asteriskNode, new SourceSpan(0, 1), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.asKeywordNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const asteriskNode = new TypeScriptAsteriskNode(new SourceSpan(1, 1));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(3, 2));
    const nameNode = new TypeScriptIdentifierNode("ns", new SourceSpan(6, 2));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNamespaceImportNode(asteriskNode, span, nameNode, asKeywordNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(asteriskNode, node.asteriskNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
