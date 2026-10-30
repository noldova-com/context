/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExportDeclarationNode,
  TypeScriptImportDeclarationNode,
  TypeScriptNamedExportsNode,
  TypeScriptNamedImportsNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ModuleSyntaxFixture } from "../../../fixtures/module-syntax.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class NamedBindingsParserTests {
  @TestMethod
  public preservesTheModuleAfterAMissingListOpener(): void {
    const result = TypeScriptParser.parse('import d, from "m";');
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(node.importClauseNode?.namedBindingsNode, TypeScriptNamedImportsNode);
    Assert.isUndefined(node.importClauseNode.namedBindingsNode.openBraceNode);
    Assert.areEqual(0, node.importClauseNode.namedBindingsNode.children.length);
    Assert.isDefined(node.fromKeywordNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("'{' expected.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public skipsAStrayClosingParenthesisInsideTheList(): void {
    const result = TypeScriptParser.parse('import {)} from "m";');
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(node.importClauseNode?.namedBindingsNode, TypeScriptNamedImportsNode);
    Assert.isDefined(node.importClauseNode.namedBindingsNode.closeBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1003", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public skipsAStraySemicolonAndReportsTheMissingBrace(): void {
    const result = TypeScriptParser.parse("import {a;");
    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("',' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(9, result.diagnostics[0]?.location?.start);
    Assert.areEqual("'}' expected.", result.diagnostics[1]?.message.text);
    Assert.areEqual(10, result.diagnostics[1]?.location?.start);
  }

  @TestData("", 0, 0)
  @TestData("a", 1, 0)
  @TestData("a,b", 2, 1)
  @TestData("a,b,", 2, 2)
  @TestMethod
  public separatesOrderedMembersFromCommaTokens(content: string, count: number, commas: number): void {
    const importNode = ModuleSyntaxFixture.parseImport('import {' + content + '} from "m";').importClauseNode?.namedBindingsNode;
    const exportNode = ModuleSyntaxFixture.parseExport("export {" + content + "};").exportClauseNode;
    Assert.isInstanceOf(importNode, TypeScriptNamedImportsNode);
    Assert.isInstanceOf(exportNode, TypeScriptNamedExportsNode);
    for (const node of [importNode, exportNode]) {
      Assert.areEqual(count, node.children.length);
      Assert.areEqual(commas, node.commaNodes.length);
      Assert.isDefined(node.openBraceNode);
      Assert.isDefined(node.closeBraceNode);
    }
  }

  @TestData('import {a b} from "m";', "TS1005@10:1 ',' expected.")
  @TestData('import {,a} from "m";', "TS1003@8:1 Identifier expected.")
  @TestData('import {from "m";', "TS1005@8:4 '}' expected.")
  @TestData('import { a from "m";', "TS1005@11:4 ',' expected.")
  @TestMethod
  public recoversImportListsWithoutConsumingTheModuleClause(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isDefined(node.fromKeywordNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData('export {a b};', "TS1005@10:1 ',' expected.")
  @TestData('export {a as};', "TS1003@12:1 Identifier expected.")
  @TestData('export {', "TS1005@8:0 '}' expected.")
  @TestData('export type {', "TS1005@13:0 '}' expected.")
  @TestMethod
  public recoversMalformedExportLists(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExportDeclarationNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("import { a, ) } from \"m\";", "TS1003:)")
  @TestData("import { a from \"m\";", "TS1005:from")
  @TestData("import { a, b c } from \"m\";", "TS1005:c")
  @TestData("export { a, ; };", "TS1003:;")
  @TestMethod
  public readsSpecifiersUpToTheModuleClause(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, "source.ts");

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public writesAnEmptyListAtTheEndOfTheCommaWhereItsOpeningBraceIsMissing(): void {
    const result = TypeScriptParser.parse("import x,  from \"y\";");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptImportDeclarationNode);
    const namedBindingsNode = statement.importClauseNode?.namedBindingsNode;
    Assert.isInstanceOf(namedBindingsNode, TypeScriptNamedImportsNode);
    Assert.isUndefined(namedBindingsNode.openBraceNode);
    Assert.areEqual(9, namedBindingsNode.span.startOffset);
    Assert.areEqual(0, namedBindingsNode.span.length);
    Assert.isUndefined(namedBindingsNode.leadingTrivia);
    Assert.areEqual("TS1005@11:4", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("import { ) from \"m\";", "{ )")
  @TestData("import { a ) from \"m\";", "{ a )")
  @TestMethod
  public endsNamedImportsAtATokenTheirListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.importClauseNode!.namedBindingsNode!.span));
  }

  @TestData("export { )", "{ )")
  @TestData("export { a )", "{ a )")
  @TestMethod
  public endsNamedExportsAtATokenTheirListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.exportClauseNode.span));
  }
}
