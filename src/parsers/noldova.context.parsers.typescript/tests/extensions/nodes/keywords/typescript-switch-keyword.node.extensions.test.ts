/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptSwitchStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptSwitchKeywordNodeExtensionsTests {
  @TestMethod
  public delegatesStatementParsingToItsGrammarOwner(): void {
    const parser = TypeScriptParserFixture.create("switch(x){} next;");
    const node = parser.currentNode.parseTypeScriptStatement(parser);
    Assert.isInstanceOf(node, TypeScriptSwitchStatementNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isFalse(parser.isEndOfFile);
  }
}
