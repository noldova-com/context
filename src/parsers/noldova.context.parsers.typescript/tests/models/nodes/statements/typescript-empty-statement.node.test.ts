/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptEmptyStatementNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptEmptyStatementNodeTests {
  @TestMethod
  public constructorPreservesTheSemicolon(): void {
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(2, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(1, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(3, 1));
    const node = new TypeScriptEmptyStatementNode(semicolonNode, semicolonNode.span, leadingTrivia, trailingTrivia);

    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(semicolonNode.span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
