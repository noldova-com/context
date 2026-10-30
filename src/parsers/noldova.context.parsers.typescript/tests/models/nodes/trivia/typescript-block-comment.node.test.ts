/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptBlockCommentNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBlockCommentNodeTests {
  @TestMethod
  @TestData("")
  @TestData(" comment ")
  @TestData(" slash // text ")
  public constructorPreservesTheBodyAndSpanWithoutTrivia(value: string): void {
    const raw = "/*" + value + "*/";
    const span = new SourceSpan(0, raw.length);
    const node = new TypeScriptBlockCommentNode(value, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesTriviaReferences(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const span = new SourceSpan(1, 4);
    const trailingTrivia = new WhitespaceNode("\n", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptBlockCommentNode("", span, leadingTrivia, trailingTrivia);

    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
