/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, SourceSpan, ValueNode, WhitespaceNode } from "@noldova/context.parsers";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { LiteralNodeFixture } from "../../fixtures/literal-node.fixture.js";

@TestClass
export class LiteralNodeTests {
  @TestMethod
  @TestData("")
  @TestData("text")
  @TestData("\n text \n")
  public constructorPreservesTheConcreteLiteralsValueAndSpan(value: string): void {
    const span = new SourceSpan(3, 4);
    const node = new LiteralNodeFixture(value, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, LiteralNode);
    Assert.isInstanceOf(node, ValueNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesTriviaReferences(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const span = new SourceSpan(1, 4);
    const trailingTrivia = new WhitespaceNode("\n", new SourceSpan(5, 1));
    const node = new LiteralNodeFixture("text", span, leadingTrivia, trailingTrivia);

    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
