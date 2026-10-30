/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExpressionStatementNode,
  TypeScriptModuleDeclarationKeywordNode,
  TypeScriptModuleDeclarationNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptModuleDeclarationKeywordNodeExtensionsTests {
  @TestData("module A {}", true)
  @TestData("module\nA {}", false)
  @TestData('module "pkg" {}', true)
  @TestData("module()", false)
  @TestData("namespace A {}", true)
  @TestData("namespace\nA {}", false)
  @TestData('namespace "pkg" {}', true)
  @TestData("namespace()", false)
  @TestMethod
  public recognizesTheDeclarationWithoutMovingItsEntry(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationKeywordNode);
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(expected, node.isTypeScriptDeclarationStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
  }

  @TestData("module")
  @TestData("module()")
  @TestData("module + 1;")
  @TestData("namespace")
  @TestData("namespace()")
  @TestData("namespace + 1;")
  @TestMethod
  public preservesIdentifierUses(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("module A {}", "TS1540")
  @TestData("namespace A {}", "")
  @TestMethod
  public dispatchesItsDeclarationWithTheWrittenKeyword(content: string, expectedCodes: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const keyword = parser.currentNode;

    const node = keyword.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.areEqual(keyword, node.keywordNode);
    Assert.areEqual(expectedCodes, parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("module {}")
  @TestData("namespace {}")
  @TestMethod
  public reportsAMissingNameAtTheOpeningBrace(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1437", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("{"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("Namespace must be given a name.", result.diagnostics[0]?.message.text);
  }
}
