/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptExpressionWithTypeArgumentsNode,
  TypeScriptIdentifierNode,
  TypeScriptNewExpressionNode,
  TypeScriptPropertyAccessExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptExpressionWithTypeArgumentsNodeExtensionsTests {
  @TestMethod
  public recognizesAnInstantiationAsALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("factory<Value>");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptExpressionWithTypeArgumentsNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptIdentifierNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.areEqual(1, node.typeArgumentListNode.children.length);
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public reportsTheTypeArgumentSpanForDirectPropertyAccess(): void {
    const parser = TypeScriptParserFixture.create("factory<Value>.property");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptExpressionWithTypeArgumentsNode);
    const diagnostic = parser.context.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual("TS1477", diagnostic.code.displayText);
    Assert.areEqual(7, diagnostic.location?.start);
    Assert.areEqual(7, diagnostic.location?.length);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsTheTypeArgumentsOfAConstructedSuperBeforeAnAccess(): void {
    const parser = TypeScriptParserFixture.create("new super<Value>.property");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptNewExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptPropertyAccessExpressionNode);
    Assert.areEqual("TS1477@9:7", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public distinguishesARelationalExpressionFollowedByAnArrayOperand(): void {
    const parser = TypeScriptParserFixture.create("factory<Value>[key]");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
