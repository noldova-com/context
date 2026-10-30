/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode,
  TypeScriptQuestionDotNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptQuestionDotNodeExtensionsTests {
  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left?.property";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptPropertyAccessExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public isUnexpectedWhereAStatementStarts(): void {
    const parser = TypeScriptParserFixture.create("?.");
    Assert.isInstanceOf(parser.currentNode, TypeScriptQuestionDotNode);
    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
    const result = TypeScriptParser.parse("?. y;");
    Assert.areEqual("TS1128", result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public readsItsChainOnAMissingOperand(): void {
    const result = TypeScriptParser.parse("x = ?. y;");
    Assert.areEqual("TS1109", result.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(4, result.diagnostics[0]?.location?.start);
  }
}
