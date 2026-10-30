/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExpressionStatementNode,
  TypeScriptGlobalKeywordNode,
  TypeScriptModuleDeclarationNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptGlobalKeywordNodeExtensionsTests {
  @TestData("global {}", true)
  @TestData("global\n{}", true)
  @TestData("global foo;", true)
  @TestData("global export {};", true)
  @TestData("global()", false)
  @TestData("global.foo;", false)
  @TestData("global;", false)
  @TestMethod
  public recognizesTheAugmentationBoundary(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptGlobalKeywordNode);
    Assert.areEqual(expected, node.isTypeScriptDeclarationStart(parser));
    Assert.areEqual(node, parser.currentNode);
  }

  @TestMethod
  public usesTheKeywordOnceWithoutInventingANameRole(): void {
    const result = TypeScriptParser.parse("declare global {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.keywordNode, TypeScriptGlobalKeywordNode);
    Assert.isUndefined(node.nameNode);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public leavesAGlobalIdentifierFollowedByASemicolonAsAnExpression(): void {
    const result = TypeScriptParser.parse("declare global;");
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public permitsAnAutomaticTerminatorBeforeAFollowingLine(): void {
    const result = TypeScriptParser.parse("global\nfoo;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }
}
