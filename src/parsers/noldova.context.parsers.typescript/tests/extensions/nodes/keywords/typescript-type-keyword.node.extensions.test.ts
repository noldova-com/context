/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptImportDeclarationNode,
  TypeScriptParser,
  TypeScriptTypeAliasDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptTypeKeywordNodeExtensionsTests {
  @TestData("type Value = number;", true)
  @TestData("type async = number;", true)
  @TestData("type + 1;", false)
  @TestData("type(value);", false)
  @TestData("type", false)
  @TestData("type\nValue;", false)
  @TestData("type /*\n*/ Value;", false)
  @TestMethod
  public requiresAnIdentifierOnTheSameLine(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    Assert.areEqual(expected, node.isTypeScriptTypeAliasStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = "type A = number;";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("type;")
  @TestData("type + 1;")
  @TestMethod
  public parsesIdentifierUsesAsExpressionStatements(content: string): void {
    const parser = TypeScriptParserFixture.create(content + " next;");

    const node = parser.currentNode.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptExpressionStatementNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData('import type { A } from "m";', "type")
  @TestData('import type from from "m";', "type")
  @TestData('import type from "m";', "")
  @TestData('import type, { a } from "m";', "")
  @TestMethod
  public beginsAnImportPhaseUnlessItNamesTheDefaultImport(content: string, expected: string): void {
    const node = TypeScriptParser.parse(content, "source.ts").rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);

    Assert.areEqual(expected, node.phaseKeywordNode?.value ?? "");
  }

  @TestData("export type as;", "TS1005@12:2")
  @TestData("export type override;", "TS1005@20:1")
  @TestData("export type\nX = 1;", "TS1128@0:6")
  @TestData("export type class C {}", "TS1128@0:6|TS2457@12:5")
  @TestData("export type { a };", "")
  @TestData('export type * from "m";', "")
  @TestMethod
  public readsAnExportedTypeAsTheReferenceDoes(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
