/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptOptionalTypeNode, TypeScriptQuestionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptOptionalTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(1, 5));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(6, 1));
    const span = new SourceSpan(1, 6);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(7, 1));
    const node = new TypeScriptOptionalTypeNode(typeNode, questionNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
