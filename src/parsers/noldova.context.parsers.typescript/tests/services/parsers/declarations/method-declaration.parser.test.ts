/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptClassDeclarationNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class MethodDeclarationParserTests {
  @TestMethod
  public parsesBodyBearingAndBodylessMethods(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { method<Value>(): Value {} optional?(); }");
    const firstNode = bodyNode.children[0];
    const secondNode = bodyNode.children[1];

    Assert.isInstanceOf(firstNode, TypeScriptMethodDeclarationNode);
    Assert.isDefined(firstNode.bodyNode);
    Assert.isDefined(firstNode.returnTypeNode);
    Assert.isInstanceOf(secondNode, TypeScriptMethodDeclarationNode);
    Assert.isDefined(secondNode.questionNode);
    Assert.isDefined(secondNode.terminatorNode);
  }

  @TestData("class C { foo<T>; }", 16, "TS1005@16:1")
  @TestData("class C { *foo; }", 14, "TS1005@14:1")
  @TestMethod
  public writesAnEmptyParameterListWhereTheOpeningParenthesisIsMissing(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptMethodDeclarationNode);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
    Assert.areEqual(offset, node.parameterListNode.span.startOffset);
    Assert.areEqual(0, node.parameterListNode.span.length);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("class C { foo() bar }", 15, "TS1144@16:3 '{' or ';' expected.")
  @TestData("declare class C { foo() bar }", 23, "TS1144@24:3 '{' or ';' expected.")
  @TestMethod
  public writesAnEmptyBodyWhereNeitherABraceNorATerminatorFollows(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptMethodDeclarationNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(offset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isUndefined(node.terminatorNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public writesAnEmptyBodyForAnObjectLiteralMethodMissingItsBrace(): void {
    const parser = TypeScriptParserFixture.create("{ foo() bar }");
    const literalNode = parser.parsePrimaryExpression();
    Assert.isInstanceOf(literalNode, TypeScriptObjectLiteralExpressionNode);
    const node = literalNode.children[0];

    Assert.isInstanceOf(node, TypeScriptMethodDeclarationNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(7, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.areEqual("TS1005@8:3 '{' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }
}
