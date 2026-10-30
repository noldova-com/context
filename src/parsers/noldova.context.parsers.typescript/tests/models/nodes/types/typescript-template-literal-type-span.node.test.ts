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
  TypeScriptTemplateLiteralTypeSpanNode,
  TypeScriptTemplateTailNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTemplateLiteralTypeSpanNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(1, 5));
    const literalNode = new TypeScriptTemplateTailNode("tail", new SourceSpan(6, 5));
    const span = new SourceSpan(1, 10);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(11, 1));
    const node = new TypeScriptTemplateLiteralTypeSpanNode(typeNode, literalNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(literalNode, node.literalNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
