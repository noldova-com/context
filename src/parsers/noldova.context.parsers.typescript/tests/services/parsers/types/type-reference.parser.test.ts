/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import {
  TypeScriptImportTypeNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptParser,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeQueryNode,
  TypeScriptTypeReferenceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeReferenceParserTests {
  @TestData("Value\n<Argument>")
  @TestData("typeof value\n<Argument>")
  @TestData("import(\"module\").Value\n<Argument>")
  @TestMethod
  public leavesTypeArgumentsAfterALineBreakForTheFollowingGrammar(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.areEqual(content.indexOf("\n"), node.span.endOffset);
    Assert.areEqual("<", parser.typescriptLexer.reader.source.getText(parser.currentNode.span));
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("Value.<Argument>")
  @TestData("typeof Value.<Argument>")
  @TestData("import(\"module\").Value.<Argument>")
  @TestMethod
  public acceptsTheDotBeforeGenericArguments(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.areEqual(content.length, node.span.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("const")
  @TestData("Namespace.class")
  @TestData("typeof const")
  @TestData("typeof Namespace.return")
  @TestMethod
  public acceptsIdentifierNamesInTypeReferences(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.areEqual(content.length, node.span.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public retainsTheFollowingStatementWhenAQualifiedNameEndsAtALineBreak(): void {
    const parser = TypeScriptParserFixture.create("A.\nB C;");
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.areEqual("B", parser.typescriptLexer.reader.source.getText(parser.currentNode.span));
    const diagnostic = parser.context.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual("TS1003", diagnostic.code.displayText);
    Assert.areEqual(2, diagnostic.location?.start);
    Assert.areEqual(0, diagnostic.location?.length);
  }

  @TestMethod
  public retainsASeparatorAfterAMissingQualifiedName(): void {
    const parser = TypeScriptParserFixture.create("A., B");
    parser.parseType();
    Assert.areEqual(",", parser.typescriptLexer.reader.source.getText(parser.currentNode.span));
    Assert.areEqual("TS1003@2:1 Identifier expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesReferencesQueriesAndImports(): void {
    const referenceNode = TypeScriptParserFixture.create("Namespace.Value<Argument>").parseType();
    const queryNode = TypeScriptParserFixture.create("typeof Namespace.Value").parseType();
    const importNode = TypeScriptParserFixture.create("import(\"module\").Value").parseType();

    Assert.isInstanceOf(referenceNode, TypeScriptTypeReferenceNode);
    Assert.isInstanceOf(queryNode, TypeScriptTypeQueryNode);
    Assert.isInstanceOf(importNode, TypeScriptImportTypeNode);
  }

  @TestMethod
  public reportsAndRepresentsAMissingType(): void {
    const parser = TypeScriptParserFixture.create(String.empty);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptMissingTypeNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(0, node.span.length);
    Assert.areEqual("TS1110@0:0 Type expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type A=typeof [];", "TS1003@14:1 Identifier expected.")
  @TestData("type A=typeof \n", "TS1003@13:0 Identifier expected.")
  @TestData("function f():", "TS1110@13:0 Type expected.")
  @TestData("type A= \n", "TS1110@7:0 Type expected.")
  @TestMethod
  public reportsAMissingQueryNameOrType(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("let v: A.#b;", "TS1003@11:0")
  @TestData("let v: A.#b.c;", "TS1003@11:0")
  @TestData("let v: A.#b.c.d;", "TS1003@11:0")
  @TestData("let v: typeof A.#b;", "TS1003@18:0")
  @TestData("let v: A.b;", "")
  @TestMethod
  public readsPastAPrivateNameWrittenAfterADot(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = import(\"m\")<(a?, b) => void>;", "")
  @TestData("type T = import(\"m\", { with: { \"resolution-mode\": `x${1}` } });", "")
  @TestData("type T = import(\"m\")<{ a: number = 1 }>;", "")
  @TestMethod
  public leavesUncheckedWhatAnImportTypePasses(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("type A = import( );", "TS1110@17:1")
  @TestData("type A = import();", "TS1110@16:1")
  @TestMethod
  public writesAMissingImportArgumentAtTheEndOfTheOpeningParenthesis(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(statement.typeNode, TypeScriptImportTypeNode);
    Assert.isInstanceOf(statement.typeNode.argumentNode, TypeScriptMissingTypeNode);
    Assert.areEqual(16, statement.typeNode.argumentNode.span.startOffset);
    Assert.areEqual(0, statement.typeNode.argumentNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("import(\"a\"). ;", 12, "TS1110@13:1")
  @TestData("typeof import(\"a\").", 19, "TS1110@19:0")
  @TestMethod
  public writesAMissingQualifierAtTheEndOfTheDot(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptImportTypeNode);
    Assert.isInstanceOf(node.qualifierNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(offset, node.qualifierNode.span.startOffset);
    Assert.areEqual(0, node.qualifierNode.span.length);
    Assert.areEqual(offset, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
