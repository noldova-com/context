/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import { TypeScriptCallExpressionNode, TypeScriptFunctionTypeNode, TypeScriptTypeReferenceNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class CallExpressionParserTests {
  @TestMethod
  public parsesCallsWithAndWithoutTypeArguments(): void {
    const callNode = TypeScriptParserFixture.create("target(value)").parseExpression();
    const typedCallNode = TypeScriptParserFixture.create("target<Value>(value)").parseExpression();

    Assert.isInstanceOf(callNode, TypeScriptCallExpressionNode);
    Assert.isInstanceOf(typedCallNode, TypeScriptCallExpressionNode);
  }

  @TestData("target<Outer<Inner>>(value)", TypeScriptTypeReferenceNode)
  @TestData("target<<Value>() => Value>(value)", TypeScriptFunctionTypeNode)
  @TestMethod
  public recognizesNestedAndFunctionTypeArguments(content: string, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.areEqual(1, node.typeArgumentListNode.children.length);
    Assert.isInstanceOf(node.typeArgumentListNode.children[0], expectedType);
    Assert.isDefined(node.typeArgumentListNode.greaterThanNode);
    Assert.areEqual(1, node.argumentListNode.children.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
