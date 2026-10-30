/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptTemplateSpanNode, TypeScriptTemplateTailNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTemplateSpanNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const node = new TypeScriptTemplateSpanNode(expressionNode, undefined, new SourceSpan(0, 5));

    Assert.isUndefined(node.literalNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const literalNode = new TypeScriptTemplateTailNode("}after`", new SourceSpan(6, 7));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTemplateSpanNode(expressionNode, literalNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(literalNode, node.literalNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
