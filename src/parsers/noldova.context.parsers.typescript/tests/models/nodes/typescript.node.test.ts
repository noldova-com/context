/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const node = new TypeScriptNode([], new SourceSpan(0, 0));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesStatementsSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const statements = [new TypeScriptIdentifierNode("value", new SourceSpan(1, 5))];
    const span = new SourceSpan(1, 5);
    const trailingTrivia = new WhitespaceNode("\n", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNode(statements, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(statements, node.children);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
