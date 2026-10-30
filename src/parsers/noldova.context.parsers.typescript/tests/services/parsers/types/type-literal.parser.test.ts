/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptMappedTypeNode,
  TypeScriptParser,
  TypeScriptPropertySignatureNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeLiteralParserTests {
  @TestMethod
  public parsesEmptyAndPopulatedTypeLiterals(): void {
    const emptyParser = TypeScriptParserFixture.create("{}");
    const populatedParser = TypeScriptParserFixture.create("{ value: string; }");
    const emptyNode = emptyParser.parseType();
    const populatedNode = populatedParser.parseType();

    Assert.isInstanceOf(emptyNode, TypeScriptTypeLiteralNode);
    Assert.areEqual(0, emptyNode.children.length);
    Assert.isInstanceOf(populatedNode, TypeScriptTypeLiteralNode);
    Assert.areEqual(1, populatedNode.children.length);
    Assert.isInstanceOf(populatedNode.children[0], TypeScriptPropertySignatureNode);
    Assert.areEqual(0, emptyParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, populatedParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesMappedTypesAndTheirModifiers(): void {
    const parser = TypeScriptParserFixture.create("{ -readonly [Key in keyof Value as Key]-?: Value[Key]; extra: string; }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMappedTypeNode);
    Assert.isDefined(node.readonlyOperatorNode);
    Assert.isDefined(node.readonlyKeywordNode);
    Assert.isDefined(node.openBracketNode);
    Assert.isDefined(node.asKeywordNode);
    Assert.isDefined(node.nameTypeNode);
    Assert.isDefined(node.closeBracketNode);
    Assert.isDefined(node.optionalOperatorNode);
    Assert.isDefined(node.questionNode);
    Assert.isDefined(node.colonNode);
    Assert.isDefined(node.typeNode);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesReadonlyMappedTypesWithoutExplicitOperators(): void {
    const parser = TypeScriptParserFixture.create("{ readonly [Key in Value]?: Result }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMappedTypeNode);
    Assert.isUndefined(node.readonlyOperatorNode);
    Assert.isDefined(node.readonlyKeywordNode);
    Assert.isUndefined(node.optionalOperatorNode);
    Assert.isDefined(node.questionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesMappedTypesWithoutReadonlyOrOptionalModifiers(): void {
    const parser = TypeScriptParserFixture.create("{ [Key in Value]: Result }");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMappedTypeNode);
    Assert.isUndefined(node.readonlyOperatorNode);
    Assert.isUndefined(node.readonlyKeywordNode);
    Assert.isUndefined(node.optionalOperatorNode);
    Assert.isUndefined(node.questionNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("{ [Key in Value]-: Result }", false, true, true, "TS1005@17:1 '?' expected.")
  @TestData("{ [Key in Value", false, false, false, "TS1005@15:0 ']' expected.")
  @TestData("{ [Key in Value]: Result", false, true, false, "TS1005@24:0 '}' expected.")
  @TestMethod
  public reportsIncompleteMappedTypeSuffixesAndClosers(
    content: string,
    hasQuestion: boolean,
    hasCloseBracket: boolean,
    hasCloseBrace: boolean,
    expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMappedTypeNode);
    Assert.areEqual(hasQuestion, !Object.isUndefined(node.questionNode));
    Assert.areEqual(hasCloseBracket, !Object.isUndefined(node.closeBracketNode));
    Assert.areEqual(hasCloseBrace, !Object.isUndefined(node.closeBraceNode));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public endsATypeLiteralAtAPlusThatStartsNoMappedType(): void {
    const result = TypeScriptParser.parse("type T = { +[Key Value]-: Result");
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptTypeLiteralNode);
    Assert.areEqual(0, aliasNode.typeNode.children.length);
    Assert.isUndefined(aliasNode.typeNode.closeBraceNode);
    Assert.areEqual(3, result.rootNode.children.length);
    Assert.areEqual(
      "TS1131@11:1 Property or signature expected.|TS1005@17:5 ',' expected.|TS1109@24:1 Expression expected.",
      TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public reportsAMissingTypeLiteralCloseBrace(): void {
    const parser = TypeScriptParserFixture.create("{ value: string");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual("TS1005@15:0 '}' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("var v: { bar: number = 5; }; type T = { baz?: string = \"a\" };", "TS1247:5,TS1247:\"a\"")
  @TestMethod
  public refusesAnInitializerOnATypeLiteralProperty(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("type M = { [K in string]: 1; a: number = 1; };", "")
  @TestData("type M = { [K in string]: 1; m(a?, b): void; };", "")
  @TestData("type M = { [K in string]: 1 a: number };", "TS1005:a")
  @TestData("type M = { [K in string]: 1; [x: number]: 1, b };", "")
  @TestData("type M = { [K in string]: 1 = 2 };", "TS1005:=")
  @TestData("type M = { [K in string]: 1 @ };", "TS1005:@,TS1146:,TS1109:},TS1128:}")
  @TestData("type M = { [K in string]: 1 + };", "TS1005:+,TS1109:}")
  @TestData("type M = { [K in string]: 1; = };", "TS1131:=")
  @TestData("type M = { [K in string]: 1; # };", "TS1127:#")
  @TestData("type M = { [K in string]: 1; ; };", "TS1131:;")
  @TestMethod
  public readsTheMembersAfterAMappedTypesTemplateUnchecked(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("type T = { a: 1 ) };", "TS1005:)")
  @TestData("interface I { a: 1 ) }", "TS1005:)")
  @TestData("type M = { [K in string]: 1; ) };", "TS1131:)")
  @TestData("type T = { a: 1; ) };", "TS1131:)")
  @TestData("type M = { [K in string]: 1 ] };", "TS1005:]")
  @TestData("type T = { a: 1 ] };", "TS1005:]")
  @TestData("type M = { [K in string]: 1; a: 1 ) };", "TS1005:)")
  @TestData("var x: { a: 1 ) } = 1;", "TS1005:)")
  @TestData("type M = { [K in string]: 1 ) };", "TS1005:)")
  @TestData("function f(a: { b: 1 ) ) {}", "TS1005:),TS1144:)")
  @TestData("f(<{ b: 1 ]>(x));", "TS1005:],TS1131:>")
  @TestData("var a = [ <{ b: 1 ] > x ];", "TS1005:],TS1005:]")
  @TestData("class C { m(x: { a: 1 ) ) {} }", "TS1005:),TS1144:),TS1068:{,TS1128:}")
  @TestData("interface I { a: 1 > }", "TS1005:>,TS1109:}")
  @TestData("type T = { a: ( ) };", "TS1005:}")
  @TestMethod
  public passesOverAStrayCloserNoEnclosingListReads(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("type F = { [await in \"a\"]: 1 };", "")
  @TestData("type G = { [yield in \"a\"]: 1 };", "TS1212@12:5")
  @TestData("type F = { readonly [await in \"a\"]: 1 };", "")
  @TestData("type F = { +readonly [await in \"a\"]: 1 };", "")
  @TestData("type F = { +readonly [yield in \"a\"]: 1 };", "TS1212@22:5")
  @TestData("type F = { -readonly [yield in \"a\"]: 1 };", "TS1212@22:5")
  @TestData("type F = { -readonly [await in \"a\"]?: 1 };", "")
  @TestData("type F = { [readonly in \"a\"]: 1 };", "")
  @TestData("async function f() { type F = { [await in \"a\"]: 1 }; }", "")
  @TestData("function* g() { type F = { [yield in \"a\"]: 1 }; }", "TS1212@28:5")
  @TestData("function* g() { let x: { [yield in \"a\"]: 1 }; }", "TS1212@26:5")
  @TestData("export {}; type F = { [await in \"a\"]: 1 };", "TS1262@23:5")
  @TestData("class C { static { type F = { [await in \"a\"]: 1 }; } }", "")
  @TestData("async function* g() { type F = { [yield in \"a\"]: 1, [await in \"b\"]: 2 }; }", "TS1005@50:1|TS1109@59:2")
  @TestData("type F = { [this in \"a\"]: 1 };", "")
  @TestMethod
  public readsEveryNameAsAMappedTypesKey(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type F = { [await in \"a\"]: 1 };")
  @TestData("type F = { +readonly [yield in \"a\"]: 1 };")
  @TestMethod
  public readsAYieldOrAwaitKeyAsAMappedType(content: string): void {
    const node = TypeScriptParser.parse(content).rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(node.typeNode, TypeScriptMappedTypeNode);
  }

  @TestData("type T = { [K in X]: [ } ] };", "TS1110:}")
  @TestMethod
  public readsAMappedTypesTemplateInNoListOfItsOwn(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("{ )", "{ )")
  @TestData("{ a: T; )", "{ a: T; )")
  @TestMethod
  public endsATypeLiteralAtATokenItsMemberListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeLiteralNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }

  @TestData("{ [K in X]: T; a: T; )", "{ [K in X]: T; a: T; )")
  @TestMethod
  public endsAMappedTypeAtATokenItsMemberListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMappedTypeNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
