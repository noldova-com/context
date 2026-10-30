/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptDotNode,
  TypeScriptIdentifierNode,
  TypeScriptMetaPropertyNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNewKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMetaPropertyNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const keywordNode = new TypeScriptNewKeywordNode(new SourceSpan(0, 3));
    const dotNode = new TypeScriptDotNode(new SourceSpan(3, 1));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(4, 0));
    const node = new TypeScriptMetaPropertyNode(keywordNode, new SourceSpan(0, 4), nameNode, dotNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(dotNode, node.dotNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const keywordNode = new TypeScriptNewKeywordNode(new SourceSpan(1, 3));
    const dotNode = new TypeScriptDotNode(new SourceSpan(4, 1));
    const nameNode = new TypeScriptIdentifierNode("target", new SourceSpan(5, 6));
    const span = new SourceSpan(1, 10);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptMetaPropertyNode(keywordNode, span, nameNode, dotNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(keywordNode, node.keywordNode);
    Assert.areEqual(dotNode, node.dotNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
