/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContinueStatementNode, TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptContinueKeywordNodeExtensionsTests {
  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = "continue;";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptContinueStatementNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual("TS1104", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }
}
