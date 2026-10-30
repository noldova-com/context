/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptParser,
  TypeScriptTypeCheckExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeCheckExpressionNodeExtensionsTests {
  @TestData("a as T + b;")
  @TestData("a * b satisfies T + c;")
  @TestMethod
  public letsALowerPrecedenceOperatorContinueAfterItsType(content: string): void {
    const statement = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);

    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.leftNode, TypeScriptTypeCheckExpressionNode);
  }

  @TestData("value as Type;")
  @TestData("value satisfies Type;")
  @TestMethod
  public namesItsExpressionAsItsFirstChildAndOuterOperand(content: string): void {
    const statement = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    const node = statement.expressionNode;
    Assert.isInstanceOf(node, TypeScriptTypeCheckExpressionNode);

    Assert.areEqual(node.expressionNode, node.getTypeScriptFirstChild());
    Assert.areEqual(node.expressionNode, node.getTypeScriptOuterExpressionOperand());
  }
}
