/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptWithStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptWithKeywordNodeExtensionsTests {
  @TestMethod
  public delegatesStatementParsingToItsGrammarOwner(): void {
    const parser = TypeScriptParserFixture.create("with(x){} next;");
    const node = parser.currentNode.parseTypeScriptStatement(parser);
    Assert.isInstanceOf(node, TypeScriptWithStatementNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1101", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.isFalse(parser.isEndOfFile);
  }
}
