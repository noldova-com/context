/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCaseClauseNode, TypeScriptDefaultClauseNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCaseKeywordNodeExtensionsTests {
  @TestMethod
  public recognizesAndParsesOnlyTheCurrentSwitchClause(): void {
    const parser = TypeScriptParserFixture.create("case 1: break; default:");
    Assert.isTrue(parser.currentNode.isTypeScriptSwitchClauseStart());
    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
    const node = parser.currentNode.parseTypeScriptSwitchClause(parser);
    Assert.isInstanceOf(node, TypeScriptCaseClauseNode);
    Assert.areEqual(1, node.children.length);
    Assert.isTrue(parser.currentNode.isTypeScriptSwitchClauseStart());
    Assert.isInstanceOf(parser.currentNode.parseTypeScriptSwitchClause(parser), TypeScriptDefaultClauseNode);
    Assert.areEqual("TS1105", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }
}
