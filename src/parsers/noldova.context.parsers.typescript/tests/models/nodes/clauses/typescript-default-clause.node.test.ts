/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptColonNode, TypeScriptDefaultClauseNode, TypeScriptDefaultKeywordNode, TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDefaultClauseNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const defaultKeywordNode = new TypeScriptDefaultKeywordNode(new SourceSpan(0, 7));
    const node = new TypeScriptDefaultClauseNode(defaultKeywordNode, [], new SourceSpan(0, 7));

    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const defaultKeywordNode = new TypeScriptDefaultKeywordNode(new SourceSpan(1, 7));
    const colonNode = new TypeScriptColonNode(new SourceSpan(8, 1));
    const statements = [new TypeScriptIdentifierNode("statement", new SourceSpan(10, 9))];
    const span = new SourceSpan(1, 18);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptDefaultClauseNode(defaultKeywordNode, statements, span, colonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(defaultKeywordNode, node.defaultKeywordNode);
    Assert.areEqual(statements, node.children);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
