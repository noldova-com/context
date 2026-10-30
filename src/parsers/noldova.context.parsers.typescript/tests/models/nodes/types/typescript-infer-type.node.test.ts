/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptInferKeywordNode,
  TypeScriptInferTypeNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptInferTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const inferKeywordNode = new TypeScriptInferKeywordNode(new SourceSpan(1, 5));
    const nameNode = new TypeScriptIdentifierNode("T", new SourceSpan(7, 1));
    const typeParameterNode = new TypeScriptTypeParameterNode([], nameNode, nameNode.span);
    const span = new SourceSpan(1, 7);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(8, 1));
    const node = new TypeScriptInferTypeNode(inferKeywordNode, span, typeParameterNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(inferKeywordNode, node.inferKeywordNode);
    Assert.areEqual(typeParameterNode, node.typeParameterNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
