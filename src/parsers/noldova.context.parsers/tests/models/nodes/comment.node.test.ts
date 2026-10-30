/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommentNode, SourceSpan, ValueNode, WhitespaceNode } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { CommentNodeFixture } from "../../fixtures/comment-node.fixture.js";

@TestClass
export class CommentNodeTests {
  @TestMethod
  @TestData("")
  @TestData(" comment ")
  @TestData("\n * documentation\n ")
  @TestData("// body text")
  public constructorPreservesTheBodyAndCompleteSpan(value: string): void {
    const span = new SourceSpan(4, value.length + 4);
    const node = new CommentNodeFixture(value, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, CommentNode);
    Assert.isInstanceOf(node, ValueNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesTriviaReferences(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode("\n", new SourceSpan(5, 1));
    const node = new CommentNodeFixture("", new SourceSpan(1, 4), leadingTrivia, trailingTrivia);

    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
