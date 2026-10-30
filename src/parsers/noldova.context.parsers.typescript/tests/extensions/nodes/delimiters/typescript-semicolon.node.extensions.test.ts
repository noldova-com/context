/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptEmptyStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptSemicolonNodeExtensionsTests {
  @TestMethod
  public leavesItsTokenForTheStatementOwnerWhenAnExpressionIsMissing(): void {
    const parser = TypeScriptParserFixture.create("; next;");
    const token = parser.currentNode;
    const expression = token.parseTypeScriptPrimaryExpression(parser);
    Assert.isInstanceOf(expression, TypeScriptMissingExpressionNode);
    Assert.areEqual(0, expression.span.length);
    Assert.areEqual(token, parser.currentNode);
    Assert.isInstanceOf(token.parseTypeScriptStatement(parser), TypeScriptEmptyStatementNode);
    Assert.isInstanceOf(parser.currentNode, TypeScriptIdentifierNode);
    Assert.areEqual("TS1109@0:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public startsNoRecoveryStatement(): void {
    const node = new TypeScriptSemicolonNode(new SourceSpan(0, 1));
    Assert.isFalse(node.canStartTypeScriptRecoveryStatement(TypeScriptParserFixture.create(";")));
  }

  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = ";";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptEmptyStatementNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
