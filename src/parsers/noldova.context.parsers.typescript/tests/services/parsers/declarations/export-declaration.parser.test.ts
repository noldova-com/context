/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptExportDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamedExportsNode,
  TypeScriptNamespaceExportNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class ExportDeclarationParserTests {
  @TestData("export * as await from \"m\";", "TS1262@12:5")
  @TestData("export * as let from \"m\";", "TS1214@12:3")
  @TestData("export * as default from \"m\";", "")
  @TestMethod
  public checksANamespaceExportNameAsAnIdentifier(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData('export { a, b as c };', false, false, false)
  @TestData('export {a} from "m";', false, true, false)
  @TestData('export * from "m";', false, true, true)
  @TestData('export * as ns from "m";', false, true, true)
  @TestData('export type {T} from "m";', true, true, false)
  @TestData('export type * from "m";', true, true, true)
  @TestData('export type * as ns from "m";', true, true, true)
  @TestMethod
  public keepsTypeOnlyNamedAndWildcardExportsDistinct(content: string, isTypeOnly: boolean, hasModuleSpecifier: boolean, isWildcard: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    Assert.areEqual(isTypeOnly, !Object.isUndefined(node.typeKeywordNode));
    Assert.areEqual(hasModuleSpecifier, !Object.isUndefined(node.fromKeywordNode));
    Assert.areEqual(hasModuleSpecifier, !Object.isUndefined(node.moduleSpecifierNode));
    Assert.areEqual(isWildcard, node.exportClauseNode instanceof TypeScriptNamespaceExportNode);
    Assert.areEqual(!isWildcard, node.exportClauseNode instanceof TypeScriptNamedExportsNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public retainsAnExportedNamespaceAlias(): void {
    const result = TypeScriptParser.parse('export * as ns from "m";');
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    Assert.isInstanceOf(node.exportClauseNode, TypeScriptNamespaceExportNode);
    Assert.isDefined(node.exportClauseNode.asKeywordNode);
    Assert.isInstanceOf(node.exportClauseNode.nameNode, ValueNode);
    Assert.areEqual("ns", node.exportClauseNode.nameNode.value);
  }

  @TestData('export {a} "m";', 11, 3)
  @TestData('export * "m";', 9, 3)
  @TestData('export * as from "m";', 17, 3)
  @TestMethod
  public recoversMissingFromKeywords(content: string, start: number, length: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("'from' expected.", result.diagnostics[0]?.message.text);
  }

  @TestData('export { "remote" as local };', "TS1003@9:8")
  @TestData('export { first, "remote" as local, "other" as second };', "TS1003@16:8|TS1003@35:7")
  @TestData('export { "remote" as local } from "pkg";', "")
  @TestData('export { "remote" };', "")
  @TestData('export { local as "remote" };', "")
  @TestMethod
  public readsAWrittenStringAsANameOnlyWhereItsModuleIsWritten(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public doesNotAttachAFollowingLineAsAModuleSpecifier(): void {
    const result = TypeScriptParser.parse('export {a}\n"m";');
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    Assert.isUndefined(node.moduleSpecifierNode);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("{ export {}; }", "TS1233@2:6")
  @TestData("function f() { export {}; }", "TS1233@15:6")
  @TestData("export {};", "")
  @TestMethod
  public readsWhereAnExportIsWritten(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("export { await as x, 1 } from \"m\";", "TS1003@21:1|TS1128@23:1|TS1434@25:4")
  @TestData("export { await as x, 1 };", "TS1003@21:1|TS1128@23:1")
  @TestMethod
  public forgetsTheAwaitNamesAnExportReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public writesAMissingNamespaceNameAfterAs(): void {
    const result = TypeScriptParser.parse("export * as ;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    const namespaceNode = node.exportClauseNode;

    Assert.isInstanceOf(namespaceNode, TypeScriptNamespaceExportNode);
    Assert.isDefined(namespaceNode.asKeywordNode);
    Assert.isInstanceOf(namespaceNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(11, namespaceNode.nameNode.span.startOffset);
    Assert.areEqual(0, namespaceNode.nameNode.span.length);
    Assert.areEqual(11, namespaceNode.span.endOffset);
    Assert.areEqual("TS1003@12:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
