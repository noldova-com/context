/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptAccessorNode,
  TypeScriptClassDeclarationNode,
  TypeScriptGetAccessorNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptParser,
  TypeScriptSetAccessorNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class AccessorParserTests {
  @TestMethod
  public distinguishesGettersFromMethodsNamedGet(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { get value(): Value {} get() {} }");

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptGetAccessorNode);
    Assert.isDefined(bodyNode.children[0].bodyNode);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptMethodDeclarationNode);
  }

  @TestMethod
  public distinguishesSettersFromMethodsNamedSet(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { set value(next: Value) {} set() {} }");

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptSetAccessorNode);
    Assert.isDefined(bodyNode.children[0].bodyNode);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptMethodDeclarationNode);
  }

  @TestData("class C { get value<T>(): string {} }", "TS1094@14:5")
  @TestData("class C { get value(input: string): string {} }", "TS1054@14:5")
  @TestData("class C { set value<T>(input: string) {} }", "TS1094@14:5")
  @TestData("class C { set value(input: string): void {} }", "TS1095@14:5")
  @TestData("class C { set value() {} }", "TS1049@14:5")
  @TestData("class C { set value(input?: string) {} }", "TS1051@25:1")
  @TestData("class C { set value(input = fallback) {} }", "TS1052@14:5")
  @TestData("class C { set value(...input: string[]) {} }", "TS1053@20:3")
  @TestMethod
  public reportsAnInvalidAccessorSignature(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = { get value(...: Value); };", TypeScriptGetAccessorNode, "TS1003@24:1 Identifier expected.")
  @TestData("type T = { set value(... = fallback); };", TypeScriptSetAccessorNode, "TS1003@25:1 Identifier expected.")
  @TestMethod
  public reportsAMissingRestParameterNameInAnAccessor(content: string, expectedType: Function & NodeType, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptTypeLiteralNode);
    Assert.isInstanceOf(aliasNode.typeNode.children[0], expectedType);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("var o = { get value() { return 1; } };", "")
  @TestData("var o = { get value(); };", "TS1005@21:1")
  @TestData("type T = { set value(next: number) {} };", "TS1183@35:2")
  @TestMethod
  public readsAnAccessorInEveryMemberList(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { get x {} }", "TS1005@16:1")
  @TestData("class C { set x {} }", "TS1005@16:1")
  @TestMethod
  public writesAnEmptyParameterListWhereTheOpeningParenthesisIsMissing(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptAccessorNode);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
    Assert.areEqual(15, node.parameterListNode.span.startOffset);
    Assert.areEqual(0, node.parameterListNode.span.length);
    Assert.isDefined(node.bodyNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("class C { get x() 5 }", 17, "TS1005@18:1 '{' expected.")
  @TestData("class C { set x(v) 5 }", 18, "TS1005@19:1 '{' expected.")
  @TestData("declare class C { get x() 5 }", 25, "TS1005@26:1 '{' expected.")
  @TestData("abstract class C { abstract get x() 5 }", 35, "TS1005@36:1 '{' expected.")
  @TestMethod
  public writesAnEmptyBodyWhereNeitherABraceNorATerminatorFollows(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptAccessorNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(offset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isUndefined(node.terminatorNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public writesAnEmptyBodyForAnObjectLiteralAccessorMissingItsBrace(): void {
    const parser = TypeScriptParserFixture.create("{ get x() 5 }");
    const literalNode = parser.parsePrimaryExpression();
    Assert.isInstanceOf(literalNode, TypeScriptObjectLiteralExpressionNode);
    const node = literalNode.children[0];

    Assert.isInstanceOf(node, TypeScriptAccessorNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(9, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.areEqual("TS1005@10:1 '{' expected.|TS1005@12:1 ':' expected.",
      TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public leavesATypeMemberAccessorWithoutABody(): void {
    const result = TypeScriptParser.parse("interface I { get x() }");
    const interfaceNode = result.rootNode.children[0];
    Assert.isInstanceOf(interfaceNode, TypeScriptInterfaceDeclarationNode);
    const node = interfaceNode.children[0];

    Assert.isInstanceOf(node, TypeScriptAccessorNode);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual(0, result.diagnostics.length);
  }
}
