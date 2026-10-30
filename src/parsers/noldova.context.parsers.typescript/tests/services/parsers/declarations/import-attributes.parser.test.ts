/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptAssertKeywordNode,
  TypeScriptImportDeclarationNode,
  TypeScriptImportTypeNode,
  TypeScriptParser,
  TypeScriptWithKeywordNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ImportAttributesParserTests {
  @TestMethod
  public leavesTheFollowingGrammarAfterAMissingAttributeOpener(): void {
    const parser = TypeScriptParserFixture.create('import "m" with type: "json";');
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isDefined(node.attributesNode);
    Assert.isUndefined(node.attributesNode.openBraceNode);
    Assert.areEqual(0, node.attributesNode.children.length);
    Assert.areEqual(16, parser.currentNode.span.startOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("'{' expected.", parser.context.diagnosticCollector.diagnostics[0]?.message.text);
  }

  @TestMethod
  public leavesAnInvalidNumericAttributeForRecovery(): void {
    const parser = TypeScriptParserFixture.create('import "m" with { 1: "json" };');
    parser.context.enterList(TypeScriptListKind.SourceElements);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(0, node.attributesNode?.children.length);
    Assert.areEqual(18, parser.currentNode.span.startOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1478", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public skipsAStraySemicolonBetweenAttributes(): void {
    const result = TypeScriptParser.parse('import "m" with { type: "json"\n; mode: "strict" };');
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(2, node.attributesNode?.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(31, result.diagnostics[0]?.location?.start);
  }

  @TestData('import "m" with { , type: "json" };', "TS1478")
  @TestMethod
  public recoversStrayAttributeSeparators(content: string, code: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isDefined(node.attributesNode?.closeBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
  }

  @TestData('import "m" with { type: "json" };', 1)
  @TestData('import "m" with { "type": "json", mode: "strict", };', 2)
  @TestData('import "m"\nwith { type: "json" };', 1)
  @TestData('import "m" with { type: 1 + 2 };', 1)
  @TestData('import "m" with {};', 0)
  @TestMethod
  public retainsAttributeEntriesAndValueSyntax(content: string, count: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isDefined(node.attributesNode);
    Assert.isInstanceOf(node.attributesNode.keywordNode, TypeScriptWithKeywordNode);
    Assert.areEqual(count, node.attributesNode.children.length);
    Assert.isDefined(node.attributesNode.openBraceNode);
    Assert.isDefined(node.attributesNode.closeBraceNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData('import "m" assert { type: "json" };', 11)
  @TestData('export * from "m" assert { type: "json" };', 18)
  @TestMethod
  public reportsLegacyAssertSyntaxAtItsKeyword(content: string, start: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS2880", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(6, result.diagnostics[0]?.location?.length);
  }

  @TestData('import "m" with { type "json" };', "TS1005", 23, 6, "':' expected.")
  @TestData('import "m" with { type: };', "TS1109", 24, 1, "Expression expected.")
  @TestData('import "m" with { type: "json"; mode: "strict" };', "TS1005", 30, 1, "',' expected.")
  @TestMethod
  public recoversMissingAttributeSeparatorsAndValues(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestData('import "m" with { type: "json"', "'}' expected.")
  @TestData('import "m" with { type', "':' expected.")
  @TestData('import "m" with {', "'}' expected.")
  @TestMethod
  public retainsTheOriginalErrorAndAddsTheUnmatchedBraceLocation(content: string, message: string): void {
    const result = TypeScriptParser.parse(content, "module.ts");
    Assert.areEqual(1, result.diagnostics.length);
    const diagnostic = result.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual("TS1005", diagnostic.code.displayText);
    Assert.areEqual(message, diagnostic.message.text);
    Assert.areEqual(content.length, diagnostic.location?.start);
    Assert.areEqual(1, diagnostic.relatedInformation.length);
    const related = diagnostic.relatedInformation[0];
    Assert.areEqual("TS1007", related?.message.code.displayText);
    Assert.areEqual(16, related?.location?.start);
    Assert.areEqual(0, related?.location?.length);
    Assert.areEqual("module.ts", related?.location?.sourceIdentity);
    Assert.areEqual("The parser expected to find a '}' to match the '{' token here.", related?.message.text);
  }

  @TestMethod
  public doesNotAttachBraceInformationToAnUnrelatedMissingValueError(): void {
    const result = TypeScriptParser.parse('import "m" with { type:');
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public restoresRelatedDiagnosticReplacementAcrossRollback(): void {
    const parser = TypeScriptParserFixture.create('import "m" with { type');
    const initialNode = parser.currentNode;
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[0]?.relatedInformation.length);
      return true;
    });
    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.parseStatement();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public leavesAssertOnAFollowingLineOutsideTheImport(): void {
    const parser = TypeScriptParserFixture.create('import "m"\nassert { type: "json" };');
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isUndefined(node.attributesNode);
    Assert.isInstanceOf(parser.currentNode, TypeScriptAssertKeywordNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public writesEmptyTypeAttributesAtTheEndOfTheCommaWhereTheSourceWritesNone(): void {
    const parser = TypeScriptParserFixture.create("import(\"a\", )");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptImportTypeNode);
    const attributesNode = node.attributesNode;
    Assert.isDefined(attributesNode);
    Assert.areEqual(0, attributesNode.children.length);
    Assert.areEqual(11, attributesNode.span.startOffset);
    Assert.areEqual(0, attributesNode.span.length);
    Assert.isUndefined(attributesNode.leadingTrivia);
    Assert.areEqual(12, parser.context.diagnosticCollector.diagnostics[0]?.location?.start);
  }

  @TestData("import \"m\" with { )", "with { )")
  @TestData("import \"m\" with { a: \"b\" ;", "with { a: \"b\" ;")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.attributesNode!.span));
  }
}
