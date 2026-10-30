/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptSemicolonNode, TypeScriptSuperKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptSuperKeywordNodeExtensionsTests {
  @TestMethod
  public isALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("super");
    Assert.isTrue(parser.currentNode.isTypeScriptLeftHandSideExpression());
  }

  @TestMethod
  public startsAnExpression(): void {
    const node = new TypeScriptSuperKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.canStartTypeScriptExpression(TypeScriptParserFixture.create("")));
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ super /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(18, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("super");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
