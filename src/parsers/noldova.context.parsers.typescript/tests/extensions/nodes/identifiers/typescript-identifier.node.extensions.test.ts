/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptIdentifierNodeExtensionsTests {
  @TestMethod
  public convertsToItselfAsABindingName(): void {
    const node = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));

    Assert.areEqual(node, node.toTypeScriptBindingName());
  }

  @TestMethod
  public convertsToAParameterItNames(): void {
    const node = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));

    const parameterNode = node.toTypeScriptParameter();
    Assert.isDefined(parameterNode);
    Assert.areEqual(node, parameterNode.nameNode);
    Assert.areEqual(node.span, parameterNode.span);
  }

  @TestMethod
  public readsAsAPropertyNameAnAccessNameAndABindingName(): void {
    const node = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.canStartTypeScriptPropertyName());
    Assert.isTrue(node.isTypeScriptAccessName());
    Assert.isTrue(node.isTypeScriptBindingIdentifier());
    Assert.isTrue(node.canStartTypeScriptBindingName());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ value /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(18, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
