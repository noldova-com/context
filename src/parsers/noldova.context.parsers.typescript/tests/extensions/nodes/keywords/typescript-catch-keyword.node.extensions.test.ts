/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTryStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCatchKeywordNodeExtensionsTests {
  @TestMethod
  public delegatesStatementParsingToItsGrammarOwner(): void {
    const parser = TypeScriptParserFixture.create("catch{} next;");
    const node = parser.currentNode.parseTypeScriptStatement(parser);
    Assert.isInstanceOf(node, TypeScriptTryStatementNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isFalse(parser.isEndOfFile);
  }
}
