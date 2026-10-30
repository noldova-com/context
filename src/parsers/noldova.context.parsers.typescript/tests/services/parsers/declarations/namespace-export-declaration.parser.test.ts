/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import { TypeScriptMissingIdentifierNode, TypeScriptNamespaceExportDeclarationNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class NamespaceExportDeclarationParserTests {
  @TestData("export as namespace await;\nexport {};", "TS1315@0:26|TS1262@20:5")
  @TestMethod
  public readsAnAwaitNameWithoutReparsingItsStatement(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("export as namespace Library", "TS1314")
  @TestData("export as namespace", "TS1003")
  @TestData("export as", "TS1005")
  @TestMethod
  public retainsTheLastRecoveredRoleWithoutAnExplicitTerminator(content: string, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptNamespaceExportDeclarationNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public preservesTheGlobalNamespaceExportRoles(): void {
    const result = TypeScriptParser.parse("export as namespace Library;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptNamespaceExportDeclarationNode);
    Assert.isDefined(node.namespaceKeywordNode);
    Assert.isInstanceOf(node.nameNode, ValueNode);
    Assert.areEqual("Library", node.nameNode.value);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1314", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("Global module exports may only appear in module files.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public reportsAMissingNamespaceKeyword(): void {
    const result = TypeScriptParser.parse("export as Global;");
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptNamespaceExportDeclarationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(10, result.diagnostics[0]?.location?.start);
    Assert.areEqual(6, result.diagnostics[0]?.location?.length);
    Assert.areEqual("'namespace' expected.", result.diagnostics[0]?.message.text);
  }

  @TestData("export as namespace Global;", "TS1314@0:27")
  @TestData("declare export as namespace Global;", "TS1184@0:35|TS1314@0:35")
  @TestData("export export as namespace Global;", "TS1184@0:34|TS1315@0:34")
  @TestData("static export as namespace Global;", "TS1184@0:34|TS1314@0:34")
  @TestData("readonly export as namespace Global;", "TS1184@0:36|TS1314@0:36")
  @TestData("accessor export as namespace Global;", "TS1184@0:36|TS1314@0:36")
  @TestData("@dec export as namespace Global;", "TS1184@0:32|TS1314@0:32")
  @TestData("declare abstract export as namespace Global;", "TS1184@0:44|TS1314@0:44")
  @TestData("namespace N { declare export as namespace Global; }", "TS1184@14:35|TS1316@14:35")
  @TestMethod
  public readsTheWholeModifierListWrittenBeforeAGlobalExport(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public writesAMissingNameWhereTheSourceLacksOne(): void {
    const result = TypeScriptParser.parse("export as namespace;");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptNamespaceExportDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(19, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual("TS1003@19:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
