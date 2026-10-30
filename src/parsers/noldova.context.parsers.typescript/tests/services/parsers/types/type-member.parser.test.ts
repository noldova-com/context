/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptCallSignatureNode,
  TypeScriptConstructSignatureNode,
  TypeScriptGetAccessorNode,
  TypeScriptIndexSignatureNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptMethodSignatureNode,
  TypeScriptParser,
  TypeScriptPropertySignatureNode,
  TypeScriptSetAccessorNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeMemberParserTests {
  @TestData("get(): number;")
  @TestData("set(value: number): void;")
  @TestData("readonly(): void;")
  @TestData("get?(): number;")
  @TestData("set?<Value>(value: Value): void;")
  @TestData("readonly<Value>(): Value;")
  @TestMethod
  public preservesContextualWordsAsMethodNames(content: string): void {
    const parser = TypeScriptParserFixture.create(`{ ${content} }`);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(1, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptMethodSignatureNode);
    Assert.areEqual(0, node.children[0].modifierNodes.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("get: number;")
  @TestData("set?: number;")
  @TestData("readonly: number;")
  @TestData("readonly?: number;")
  @TestMethod
  public preservesContextualWordsAsPropertyNames(content: string): void {
    const parser = TypeScriptParserFixture.create(`{ ${content} }`);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(1, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertySignatureNode);
    Assert.areEqual(0, node.children[0].modifierNodes.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public separatesReadonlyFromAFollowingLineButAllowsAnAccessorNameThere(): void {
    const parser = TypeScriptParserFixture.create("{ readonly\nvalue: number; get\nother(): number; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertySignatureNode);
    Assert.areEqual(0, node.children[0].modifierNodes.length);
    Assert.isInstanceOf(node.children[1], TypeScriptPropertySignatureNode);
    Assert.isInstanceOf(node.children[2], TypeScriptGetAccessorNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesCallAndConstructSignatures(): void {
    const parser = TypeScriptParserFixture.create("{ <Value>(value: Value): Value; new (): Result; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(2, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptCallSignatureNode);
    Assert.isInstanceOf(node.children[1], TypeScriptConstructSignatureNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesMinimalAndGenericSignatures(): void {
    const parser = TypeScriptParserFixture.create("{ (): void; (); new<Value>(): Value; new(); new: Factory; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(5, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptCallSignatureNode);
    Assert.isInstanceOf(node.children[1], TypeScriptCallSignatureNode);
    Assert.isUndefined(node.children[1].colonNode);
    Assert.isInstanceOf(node.children[2], TypeScriptConstructSignatureNode);
    Assert.isDefined(node.children[2].typeParameterListNode);
    Assert.isInstanceOf(node.children[3], TypeScriptConstructSignatureNode);
    Assert.isUndefined(node.children[3].colonNode);
    Assert.isInstanceOf(node.children[4], TypeScriptPropertySignatureNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesPropertiesMethodsAndComputedNames(): void {
    const parser = TypeScriptParserFixture.create("{ readonly value?: string; method<Value>(value: Value): Value; [\"symbol\"]: number; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertySignatureNode);
    Assert.areEqual(1, node.children[0].modifierNodes.length);
    Assert.isInstanceOf(node.children[1], TypeScriptMethodSignatureNode);
    Assert.isInstanceOf(node.children[2], TypeScriptPropertySignatureNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesIndexSignaturesAndAccessors(): void {
    const parser = TypeScriptParserFixture.create("{ readonly [key: string]: Value; get value(): Value; set value(next: Value); }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptIndexSignatureNode);
    Assert.isInstanceOf(node.children[1], TypeScriptGetAccessorNode);
    Assert.isInstanceOf(node.children[2], TypeScriptSetAccessorNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public preservesAccessorTypeParametersAndReturnTypes(): void {
    const parser = TypeScriptParserFixture.create("{ get value<Type>(): Type, get other(); set value<Type>(next: Type): void }");
    const node = parser.parseType();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    const getNode = node.children[0];
    const minimalGetNode = node.children[1];
    const setNode = node.children[2];
    Assert.isInstanceOf(getNode, TypeScriptGetAccessorNode);
    Assert.areEqual(0, getNode.modifierNodes.length);
    Assert.isDefined(getNode.typeParameterListNode);
    Assert.isInstanceOf(minimalGetNode, TypeScriptGetAccessorNode);
    Assert.isUndefined(minimalGetNode.colonNode);
    Assert.isInstanceOf(setNode, TypeScriptSetAccessorNode);
    Assert.isDefined(setNode.typeParameterListNode);
    Assert.isDefined(setNode.colonNode);
    Assert.isDefined(setNode.returnTypeNode);
    Assert.areEqual(2, nodeGrammarDiagnostics.length);
    Assert.areEqual("TS1094", nodeGrammarDiagnostics[0]?.code.displayText);
    Assert.areEqual("TS1094", nodeGrammarDiagnostics[1]?.code.displayText);
  }

  @TestMethod
  public parsesRecoveredIndexSignatureShapes(): void {
    const parser = TypeScriptParserFixture.create("{ []: Empty; [...rest]: Rest; [key?: Key, other: Other]: Result; }");
    const node = parser.parseType();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    const emptyNode = node.children[0];
    const restNode = node.children[1];
    const multipleNode = node.children[2];
    Assert.isInstanceOf(emptyNode, TypeScriptIndexSignatureNode);
    Assert.isInstanceOf(restNode, TypeScriptIndexSignatureNode);
    Assert.isInstanceOf(multipleNode, TypeScriptIndexSignatureNode);
    Assert.areEqual(0, emptyNode.indexParameterListNode.children.length);
    Assert.areEqual(1, restNode.indexParameterListNode.children.length);
    Assert.areEqual(2, multipleNode.indexParameterListNode.children.length);
    Assert.areEqual(1, multipleNode.indexParameterListNode.commaNodes.length);
    Assert.areEqual(3, nodeGrammarDiagnostics.length);
    Assert.areEqual("TS1096", nodeGrammarDiagnostics[0]?.code.displayText);
    Assert.areEqual("TS1017", nodeGrammarDiagnostics[1]?.code.displayText);
    Assert.areEqual("TS1096", nodeGrammarDiagnostics[2]?.code.displayText);
  }

  @TestData("type T = { [key: Key: Result; };", "TS1005@20:1 ',' expected.|TS1005@28:1 ',' expected.|TS1138@30:1 Parameter declaration expected.")
  @TestData("type T = { [name: string; }", "TS1005@24:1 ',' expected.|TS1138@26:1 Parameter declaration expected.")
  @TestData("type T = { [key: string]; };", "TS1021@11:14 An index signature must have a type annotation.")
  @TestMethod
  public reportsMissingIndexSignatureSyntax(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptTypeLiteralNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public preservesPropertyInitializersAndCommaTerminators(): void {
    const parser = TypeScriptParserFixture.create("{ value: string = fallback, other: number }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(2, node.children.length);
    const propertyNode = node.children[0];
    Assert.isInstanceOf(propertyNode, TypeScriptPropertySignatureNode);
    Assert.isDefined(propertyNode.equalsNode);
    Assert.isDefined(propertyNode.initializerNode);
    Assert.isDefined(propertyNode.terminatorNode);
    Assert.areEqual("TS1247", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public parsesEveryLiteralAndKeywordPropertyName(): void {
    const parser = TypeScriptParserFixture.create("{ new: One; 1n: Two; 2: Three; \"four\": Four; [\"five\"]: Five; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(5, node.children.length);
    for (const childNode of node.children)
      Assert.isInstanceOf(childNode, TypeScriptPropertySignatureNode);

    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesOptionalMethodsAndMembersWithoutTerminators(): void {
    const parser = TypeScriptParserFixture.create("{ method?<Value>(value: Value): Value\nplain(); property }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(3, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptMethodSignatureNode);
    Assert.isDefined(node.children[0].questionNode);
    Assert.isInstanceOf(node.children[1], TypeScriptMethodSignatureNode);
    Assert.isUndefined(node.children[1].colonNode);
    Assert.isInstanceOf(node.children[2], TypeScriptPropertySignatureNode);
    Assert.isUndefined(node.children[2].terminatorNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsAnInvalidPropertyName(): void {
    const parser = TypeScriptParserFixture.create("{ ...; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(0, node.children.length);
    Assert.isDefined(node.closeBraceNode);
    Assert.areEqual(
      "TS1131@2:3 Property or signature expected.|TS1131@5:1 Property or signature expected.",
      TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type T = { declare get a(): number };", "TS1131:declare,TS1434:get,TS1005::,TS1128:}")
  @TestData("export type T = { declare get #x(): number };", "TS1131:declare,TS1434:get,TS1005::,TS1128:}")
  @TestData("export interface I { abstract get #x(): number }", "TS1131:abstract,TS1434:get,TS1005::,TS1128:}")
  @TestData("type T = { async get a(): number };", "TS1131:async,TS1434:get,TS1005::,TS1128:}")
  @TestData("type T = { override get a(): number };", "TS1131:override,TS1434:get,TS1005::,TS1128:}")
  @TestData("type T = { out get a(): number };", "TS1131:out,TS1434:get,TS1005::,TS1128:}")
  @TestData("interface I { abstract get a(): number; b: string }", "TS1131:abstract,TS1434:get,TS1005::,TS1128:}")
  @TestData("type T = { in get a(): number };", "TS1131:in,TS1005:a,TS1005::,TS1128:}")
  @TestData("function f() { let x: { declare get a(): number }; }", "TS1131:declare,TS1005:get,TS1005:a,TS1005:(,TS1005:},TS1128:}")
  @TestData("class C { m(x: { abstract get a(): number }) {} }", "TS1131:abstract,TS1005:a,TS1005:(,TS1005:},TS1128:),TS1128:}")
  @TestData("interface I { public \"x\" ) }", "TS1131:public,TS1005:),TS1128:}")
  @TestData("interface I { public ) }", "TS1131:public,TS1128:),TS1128:}")
  @TestData("interface I { public a ) }", "TS1131:public,TS1131:a,TS1128:),TS1128:}")
  @TestMethod
  public endsTheMemberListAtAModifierThatStartsAStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public readsAStaticAfterAStaticModifierAsTheMemberName(): void {
    const content = "type T = { static static x: number };";
    const result = TypeScriptParser.parse(content);
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptTypeLiteralNode);
    const [staticNode, nextNode] = aliasNode.typeNode.children;
    Assert.isInstanceOf(staticNode, TypeScriptPropertySignatureNode);
    Assert.areEqual("static", staticNode.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(18, staticNode.nameNode.span.startOffset);
    Assert.isUndefined(staticNode.typeNode);
    Assert.isInstanceOf(nextNode, TypeScriptPropertySignatureNode);
    Assert.areEqual(0, nextNode.modifierNodes.length);
    Assert.areEqual(25, nextNode.nameNode.span.startOffset);
    Assert.isDefined(nextNode.typeNode);
    Assert.areEqual(2, aliasNode.typeNode.children.length);
    Assert.areEqual("TS1005@25:1 ';' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("interface I { <T> }", TypeScriptCallSignatureNode, 17, "TS1005@18:1")
  @TestData("interface I { new <T> }", TypeScriptConstructSignatureNode, 21, "TS1005@22:1")
  @TestData("interface I { foo<T>; }", TypeScriptMethodSignatureNode, 20, "TS1005@20:1")
  @TestMethod
  public writesAnEmptyParameterListWhereTheOpeningParenthesisIsMissing(
    content: string,
    expectedType: typeof TypeScriptCallSignatureNode | typeof TypeScriptConstructSignatureNode | typeof TypeScriptMethodSignatureNode,
    offset: number,
    expected: string): void {
    const result = TypeScriptParser.parse(content);
    const interfaceNode = result.rootNode.children[0];
    Assert.isInstanceOf(interfaceNode, TypeScriptInterfaceDeclarationNode);
    const node = interfaceNode.children[0];

    Assert.isInstanceOf<TypeScriptCallSignatureNode | TypeScriptConstructSignatureNode | TypeScriptMethodSignatureNode>(node, expectedType);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
    Assert.areEqual(offset, node.parameterListNode.span.startOffset);
    Assert.areEqual(0, node.parameterListNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
