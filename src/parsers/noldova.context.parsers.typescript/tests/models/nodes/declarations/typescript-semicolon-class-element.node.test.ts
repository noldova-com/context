/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptPublicKeywordNode, TypeScriptSemicolonClassElementNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSemicolonClassElementNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(0, 1));
    const node = new TypeScriptSemicolonClassElementNode([], semicolonNode, new SourceSpan(0, 1));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptPublicKeywordNode(new SourceSpan(1, 6))];
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(7, 1));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptSemicolonClassElementNode(modifierNodes, semicolonNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
