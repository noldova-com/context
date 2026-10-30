/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptClassDeclarationNode,
  TypeScriptConstructorDeclarationNode,
  TypeScriptParser,
  TypeScriptPropertyDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ConstructorDeclarationParserTests {
  @TestMethod
  public distinguishesConstructorsFromNamedProperties(): void {
    const bodyNode = ClassBodyParserFixture.parse('class { constructor() {} "constructor": Factory; }');

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptConstructorDeclarationNode);
    Assert.isDefined(bodyNode.children[0].bodyNode);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptPropertyDeclarationNode);
  }

  @TestMethod
  public preservesQuotedNamesTypeParametersAndReturnAnnotations(): void {
    const body = ClassBodyParserFixture.parse('class { "constructor"<T>(): T; constructor<T>(): T; "constructor"(): T; }');
    Assert.areEqual(3, body.children.length);
    Assert.isInstanceOf(body.children[1], TypeScriptConstructorDeclarationNode);
    Assert.isDefined(body.children[1].typeParameterListNode);
    Assert.isDefined(body.children[1].colonNode);
    Assert.isDefined(body.children[1].returnTypeNode);
    Assert.isInstanceOf(body.children[2], TypeScriptConstructorDeclarationNode);
  }

  @TestData("class C { constructor }", "TS1005@22:1")
  @TestData("class C { constructor<T> }", "TS1005@25:1")
  @TestData("class C { constructor: }", "TS1005@21:1|TS1110@23:1")
  @TestData("class C { constructor() }", "")
  @TestMethod
  public recoversIncompleteConstructorHeadersWithoutInventingNames(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];

    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const constructorNode = classNode.bodyNode.children[0];
    Assert.isInstanceOf(constructorNode, TypeScriptConstructorDeclarationNode);
    Assert.areEqual("constructor", constructorNode.nameNode.value);
    Assert.isUndefined(constructorNode.bodyNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = class { constructor() { a in b; } };;) {}", "TS1434@75:1|TS1128@77:2|TS1005@85:1|TS1128@88:1")
  @TestMethod
  public holdsTheInRestrictionThroughItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public writesAnEmptyParameterListWhereTheOpeningParenthesisIsMissing(): void {
    const result = TypeScriptParser.parse("class C { constructor }");
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptConstructorDeclarationNode);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
    Assert.areEqual(21, node.parameterListNode.span.startOffset);
    Assert.areEqual(0, node.parameterListNode.span.length);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual("TS1005@22:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("class C { constructor() 5 }", 23, "TS1144@24:1 '{' or ';' expected.")
  @TestData("declare class C { constructor() 5 }", 31, "TS1144@32:1 '{' or ';' expected.")
  @TestData("class C { constructor(public a) 5 }", 31, "TS1144@32:1 '{' or ';' expected.")
  @TestMethod
  public writesAnEmptyBodyWhereNeitherABraceNorATerminatorFollows(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const classNode = result.rootNode.children[0];
    Assert.isInstanceOf(classNode, TypeScriptClassDeclarationNode);
    const node = classNode.bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptConstructorDeclarationNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(offset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isUndefined(node.terminatorNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("class C { constructor(public a) 5 }", 1)
  @TestData("class C { constructor(public a); }", 1)
  @TestData("class C { constructor(public a) {} }", 0)
  @TestMethod
  public readsParameterPropertiesAsMisplacedWithoutAWrittenBody(content: string, expected: number): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseStatement();

    Assert.areEqual(expected, parser.context.records.misplacedParameterProperties.length);
  }
}
