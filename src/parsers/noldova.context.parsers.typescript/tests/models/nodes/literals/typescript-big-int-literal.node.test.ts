/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptBigIntLiteralNode, TypeScriptLineCommentNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBigIntLiteralNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const value = "123n";
    const node = new TypeScriptBigIntLiteralNode(value, new SourceSpan(0, value.length));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesValueSpanAndTrivia(): void {
    const leadingTrivia = new TypeScriptLineCommentNode(" leading", new SourceSpan(0, 10));
    const value = "123n";
    const span = new SourceSpan(10, value.length);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptBigIntLiteralNode(value, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.areEqual<Node | undefined>(leadingTrivia, node.leadingTrivia);
    Assert.areEqual<Node | undefined>(trailingTrivia, node.trailingTrivia);
  }
}
