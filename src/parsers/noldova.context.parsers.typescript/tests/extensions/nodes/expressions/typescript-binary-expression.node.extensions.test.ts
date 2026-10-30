/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptBinaryExpressionNode, TypeScriptBindingElementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptBinaryExpressionNodeExtensionsTests {
  @TestData("&&")
  @TestData("||")
  @TestMethod
  public returnsItsLogicalOperatorWithoutCopyingIt(operator: string): void {
    const node = TypeScriptParserFixture.create(`left ${operator} right`).parseExpression();
    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);

    const operatorNode = node.getTypeScriptLogicalOperatorNode();
    Assert.areEqual(node.operatorNode, operatorNode);
    Assert.isDefined(operatorNode);
    Assert.areEqual(operator, operatorNode.value);
  }

  @TestData("left + right")
  @TestData("left ?? right")
  @TestData("(left && right)")
  @TestData("(left || right)")
  @TestMethod
  public rejectsOtherOperatorsAndDoesNotUnwrapParentheses(content: string): void {
    const node = TypeScriptParserFixture.create(content).parseExpression();

    Assert.isUndefined(node.getTypeScriptLogicalOperatorNode());
  }

  @TestMethod
  public reusesTheInitializerWhenConvertingAnAssignment(): void {
    const node = TypeScriptParserFixture.create("name = call()").parseExpression();
    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);

    const elementNode = node.toTypeScriptBindingElement();
    Assert.isInstanceOf(elementNode, TypeScriptBindingElementNode);
    Assert.areEqual(node.leftNode, elementNode.nameNode);
    Assert.areEqual(node.rightNode, elementNode.initializerNode);
    Assert.areEqual(node.operatorNode, elementNode.equalsNode);
    Assert.areEqual(node.span, elementNode.span);
    const parameterNode = node.toTypeScriptParameter();
    Assert.isDefined(parameterNode);
    Assert.areEqual(node.rightNode, parameterNode.initializerNode);
    Assert.areEqual(node.leftNode, parameterNode.nameNode);
  }

  @TestData("a + b")
  @TestData("a += b")
  @TestData("a.b = c")
  @TestMethod
  public rejectsExpressionsThatCannotBeBindings(content: string): void {
    const node = TypeScriptParserFixture.create(content).parseExpression();
    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);

    Assert.isUndefined(node.toTypeScriptBindingElement());
    Assert.isUndefined(node.toTypeScriptParameter());
  }
}
