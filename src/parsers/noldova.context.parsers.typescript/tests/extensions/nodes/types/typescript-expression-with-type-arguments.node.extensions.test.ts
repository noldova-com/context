/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptClassDeclarationNode,
  TypeScriptExpressionWithTypeArgumentsNode,
  TypeScriptIdentifierNode,
  TypeScriptNewExpressionNode,
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptParserException } from "@noldova/context.parsers.typescript/exceptions/typescript-parser.exception.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptExpressionWithTypeArgumentsNodeExtensionsTests {
  private static heritageTypeOf(content: string): TypeScriptExpressionWithTypeArgumentsNode {
    const classNode = TypeScriptParser.parse(content).rootNode.children.at(-1);
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const typeNode = classNode.heritageClauseNodes[0]?.children[0];
    Assert.isInstanceOf(typeNode, TypeScriptExpressionWithTypeArgumentsNode);
    return typeNode;
  }

  @TestData("declare class B {} class C extends B {}")
  @TestData("declare const B: { D: new () => object }; class C extends B.D {}")
  @TestMethod
  public wrapsAHeritageTypeWithoutTypeArgumentsThatNoPropertyAccessReports(content: string): void {
    const typeNode = TypeScriptExpressionWithTypeArgumentsNodeExtensionsTests.heritageTypeOf(content);

    Assert.isUndefined(typeNode.typeArgumentListNode);
    Assert.areEqual("", TypeScriptDiagnosticsFixture.project(TypeScriptParser.parse(content).diagnostics));
  }

  @TestMethod
  public refusesToReportAnInstantiationAccessWithoutTypeArguments(): void {
    const typeNode = TypeScriptExpressionWithTypeArgumentsNodeExtensionsTests.heritageTypeOf("declare class B {} class C extends B {}");

    Assert.throws(() => typeNode.reportTypeScriptInstantiationAccess(TypeScriptParserFixture.create("")), TypeScriptParserException);
  }

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
