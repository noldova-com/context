/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptSemicolonNode, TypeScriptStringLiteralNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptStringLiteralNodeExtensionsTests {
  @TestMethod
  public isALiteralTypeTokenAndStartsAPropertyName(): void {
    const node = new TypeScriptStringLiteralNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.isTypeScriptLiteralTypeToken());
    Assert.isTrue(node.canStartTypeScriptPropertyName());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ \"text\" /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(19, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("\"value\"");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }

  @TestMethod
  public recognizesOnlyConstructorNamesFollowedByAParameterList(): void {
    for (const content of ['"constructor"()', "'con\\u0073tructor'()", '"\\x63onstructor"()', '"con\\\nstructor"()']) {
      const parser = TypeScriptParserFixture.create(content);
      Assert.isTrue(parser.currentNode.isTypeScriptConstructorDeclarationStart(parser));
      Assert.areEqual(0, parser.currentNode.span.startOffset);
    }
    for (const content of ['"other"()', '"constructor"<T>()', '"constructor": T']) {
      const parser = TypeScriptParserFixture.create(content);
      Assert.isFalse(parser.currentNode.isTypeScriptConstructorDeclarationStart(parser));
    }
  }
}
