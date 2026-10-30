/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptLetKeywordNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptLetKeywordNodeExtensionsTests {
  @TestData("let value;", true)
  @TestData("let {value} = source;", true)
  @TestData("let [value] = source;", true)
  @TestData("let\nvalue;", true)
  @TestData("let + 1;", false)
  @TestData("let;", false)
  @TestMethod
  public distinguishesDeclarationsFromIdentifierUses(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    Assert.areEqual(expected, node.isTypeScriptVariableStatementStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public isAVariableDeclarationKeyword(): void {
    const node = new TypeScriptLetKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptVariableDeclarationKeyword());
  }

  @TestData("let;")
  @TestData("let + 1;")
  @TestMethod
  public parsesIdentifierUsesAsExpressionStatements(content: string): void {
    const parser = TypeScriptParserFixture.create(content + " next;");

    const node = parser.currentNode.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptExpressionStatementNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = "let a = 1;";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
