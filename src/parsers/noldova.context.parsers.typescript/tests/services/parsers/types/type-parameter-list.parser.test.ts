/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionTypeNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeParameterListParserTests {
  @TestMethod
  public parsesModifiersConstraintsAndDefaults(): void {
    const parser = TypeScriptParserFixture.create("<const in out Value extends Base = Default>(value: Value) => Value");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.areEqual(1, node.typeParameterListNode.children.length);
    const parameterNode = node.typeParameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptTypeParameterNode);
    Assert.areEqual(3, parameterNode.modifierNodes.length);
    Assert.isDefined(parameterNode.constraintKeywordNode);
    Assert.isDefined(parameterNode.constraintNode);
    Assert.isDefined(parameterNode.equalsNode);
    Assert.isDefined(parameterNode.defaultTypeNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1274", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public parsesSeveralTypeParameters(): void {
    const parser = TypeScriptParserFixture.create("<Left, Right>(value: Left) => Right");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.areEqual(2, node.typeParameterListNode.children.length);
    Assert.areEqual(1, node.typeParameterListNode.commaNodes.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsAnInvalidDeclarationAndMissingCloser(): void {
    const parser = TypeScriptParserFixture.create("<42");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.areEqual(0, node.typeParameterListNode.children.length);
    Assert.isUndefined(node.typeParameterListNode.greaterThanNode);
    Assert.areEqual("TS1139", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
  }

  @TestMethod
  public preservesATrailingCommaWithoutAClosingGreaterThan(): void {
    const parser = TypeScriptParserFixture.create("<Value,");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.areEqual(1, node.typeParameterListNode.commaNodes.length);
    Assert.isUndefined(node.typeParameterListNode.greaterThanNode);
  }

  @TestData("type T = <42;", "TS1139@10:2", 1)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("class C<:T>{}", "TS1139@8:1 Type parameter declaration expected.")
  @TestData("class C<in in>{}", "TS1359@11:2 Identifier expected. 'in' is a reserved word that cannot be used here.")
  @TestMethod
  public reportsAMissingOrReservedTypeParameterName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("class C<public T> {}", "TS1273@8:6")
  @TestData("class C<in public T> {}", "TS1273@11:6")
  @TestData("class C<in static T> {}", "TS1273@11:6")
  @TestData("class C<declare in T> {}", "TS1273@8:7")
  @TestData("interface I<const T> {}", "TS1277@12:5")
  @TestData("interface I<in const T> {}", "TS1277@15:5")
  @TestData("type T<const U> = U;", "TS1277@7:5")
  @TestData("class C<const T> {}", "")
  @TestData("function f<const T>() {}", "")
  @TestData("class C<const const T> {}", "")
  @TestData("class C<in const out T> {}", "")
  @TestData("class C<public T, public U> {}", "TS1273@8:6|TS1273@18:6")
  @TestMethod
  public reportsTheAnnotationsATypeParameterMayNotCarry(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C<T A> {}", "TS1005:A ',' expected.")
  @TestData("export class C<T A> {}", "TS1005:A ',' expected.")
  @TestData("interface I<T U> {}", "TS1005:U ',' expected.")
  @TestData("class C<T, U V> {}", "TS1005:V ',' expected.")
  @TestData("class C<T extends U V> {}", "TS1005:V ',' expected.")
  @TestData("function f<T A>() {}", "TS1005:A ',' expected.")
  @TestData("type X<T U> = 1;", "TS1005:U ',' expected.")
  @TestData("class C<T;> {}", "TS1005:; ',' expected.")
  @TestData("function f<T ; U>() {}", "TS1005:; ',' expected.")
  @TestData("class C<in> {}", "TS1359:in Identifier expected. 'in' is a reserved word that cannot be used here.")
  @TestData("class C<T ( {}", "TS1005:( '>' expected.,TS1005: ')' expected.")
  @TestData("class C<T { }", "TS1005:{ '>' expected.")
  @TestData("class C<T extends B implements I {}", "TS1005:implements '>' expected.")
  @TestData("class C<, T> {}", "TS1139:, Type parameter declaration expected.")
  @TestData("class C<T extends { ( }> {}", "TS1138:} Parameter declaration expected.")
  @TestMethod
  public readsPastAMissingCommaUpToATerminator(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectTextWithMessages(content, result.diagnostics));
  }

  @TestMethod
  public readsAStaticAfterAStaticModifierAsTheParameterName(): void {
    const content = "function f<static static T>() {}";
    const result = TypeScriptParser.parse(content);
    const functionNode = result.rootNode.children[0];

    Assert.isInstanceOf(functionNode, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(functionNode.typeParameterListNode);
    const [staticNode, nextNode] = functionNode.typeParameterListNode.children;
    Assert.isInstanceOf(staticNode, TypeScriptTypeParameterNode);
    Assert.areEqual("static", staticNode.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(18, staticNode.nameNode.span.startOffset);
    Assert.isInstanceOf(nextNode, TypeScriptTypeParameterNode);
    Assert.areEqual(0, nextNode.modifierNodes.length);
    Assert.areEqual(25, nextNode.nameNode.span.startOffset);
    Assert.areEqual(2, functionNode.typeParameterListNode.children.length);
    Assert.areEqual("TS1005:T ',' expected.", TypeScriptDiagnosticsFixture.projectTextWithMessages(content, result.diagnostics));
  }

  @TestData("function* g() { interface I<yield> {} }", "TS1139@28:5 Type parameter declaration expected.|TS1109@33:1 Expression expected.")
  @TestData("function* g() { interface I<T, yield> {} }", "TS1139@31:5 Type parameter declaration expected.|TS1109@36:1 Expression expected.")
  @TestData("async function f() { class C<await> {} }", "TS1139@29:5 Type parameter declaration expected.|TS1109@34:1 Expression expected.")
  @TestData("export {}; type T<await> = 1;", "TS1139@18:5 Type parameter declaration expected.")
  @TestData("class C { static { type T<await> = 1; } }", "TS1139@26:5 Type parameter declaration expected.|TS1005@31:1 ';' expected.|TS1109@33:1 Expression expected.")
  @TestData("function* g() { interface I<const yield> {} }", "TS1003@34:5 Identifier expected.|TS1109@39:1 Expression expected.")
  @TestData("function* g() { interface I<in yield> {} }", "TS1003@31:5 Identifier expected.|TS1109@36:1 Expression expected.")
  @TestData("function* g() { let x: <yield>() => void; }", "TS1212@24:5 Identifier expected. 'yield' is a reserved word in strict mode.")
  @TestMethod
  public readsANameInTheContextHoldingTheList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("class C<in in in>{}", "TS1359@14:2 Identifier expected. 'in' is a reserved word that cannot be used here.")
  @TestData("class C<in in, T>{}", "TS1359@11:2 Identifier expected. 'in' is a reserved word that cannot be used here.|TS1139@13:1 Type parameter declaration expected.")
  @TestData("class C<in 1>{}", "TS1003@11:1 Identifier expected.")
  @TestData("class C<const )>{}", "TS1359@8:5 Identifier expected. 'const' is a reserved word that cannot be used here.|TS1139@14:1 Type parameter declaration expected.")
  @TestData("class C<const #x>{}", "TS18016@14:2 Private identifiers are not allowed outside class bodies.")
  @TestData("type T<in if> = 1;", "TS1359@10:2 Identifier expected. 'if' is a reserved word that cannot be used here.|TS1005@12:1 ';' expected.|TS1109@14:1 Expression expected.")
  @TestData("class C<in", "TS1359@8:2 Identifier expected. 'in' is a reserved word that cannot be used here.|TS1005@10:0 '>' expected.")
  @TestMethod
  public passesOverTheTokenAMissingNameLeaves(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public startsAParameterWithoutAWrittenNameAtItsMissingName(): void {
    const result = TypeScriptParser.parse("type T<in in> = 1;");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptTypeAliasDeclarationNode);
    const parameterNode = statement.typeParameterListNode?.children[1];
    Assert.isInstanceOf(parameterNode, TypeScriptTypeParameterNode);
    Assert.areEqual(0, parameterNode.modifierNodes.length);
    Assert.isInstanceOf(parameterNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(9, parameterNode.span.startOffset);
    Assert.areEqual(0, parameterNode.span.length);
    Assert.areEqual("TS1359@10:2", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("function f<T ) {}", "<T )")
  @TestData("function f<T ;", "<T ;")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.typeParameterListNode!.span));
  }
}
