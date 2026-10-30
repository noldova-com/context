/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptOpenBraceNode,
  TypeScriptPublicKeywordNode,
  TypeScriptStaticBlockNode,
  TypeScriptStaticKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptStaticBlockNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const staticKeywordNode = new TypeScriptStaticKeywordNode(new SourceSpan(0, 6));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(7, 1)), [], new SourceSpan(7, 1));
    const node = new TypeScriptStaticBlockNode([], staticKeywordNode, bodyNode, new SourceSpan(0, 8));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptPublicKeywordNode(new SourceSpan(1, 6))];
    const staticKeywordNode = new TypeScriptStaticKeywordNode(new SourceSpan(8, 6));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(15, 1)), [], new SourceSpan(15, 1));
    const span = new SourceSpan(1, 15);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptStaticBlockNode(modifierNodes, staticKeywordNode, bodyNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(staticKeywordNode, node.staticKeywordNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
