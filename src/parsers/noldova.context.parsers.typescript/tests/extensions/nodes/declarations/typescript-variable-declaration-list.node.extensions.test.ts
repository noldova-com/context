/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser, TypeScriptVariableStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptVariableDeclarationListNodeExtensionsTests {
  @TestData("for (var [a] in x) {}", "TS2491@9:3")
  @TestData("for (const {a} in x) {}", "TS2491@11:3")
  @TestData("for (var [a] of x) {}", "")
  @TestData("for (var a in x) {}", "")
  @TestMethod
  public bindsNoPatternInAForInInitializer(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("let value = 1;", "let")
  @TestData("await using value = resource; export {};", "await using")
  @TestMethod
  public spellsItsWrittenKeyword(content: string, expected: string): void {
    const statementNode = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);

    Assert.areEqual(expected, statementNode.declarationListNode.getTypeScriptKeywordText());
  }
}
