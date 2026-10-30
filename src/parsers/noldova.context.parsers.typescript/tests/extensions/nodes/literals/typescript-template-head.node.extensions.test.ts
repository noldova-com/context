/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptSemicolonNode,
  TypeScriptTaggedTemplateExpressionNode,
  TypeScriptTemplateExpressionNode,
  TypeScriptTemplateHeadNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptTemplateHeadNodeExtensionsTests {
  @TestMethod
  public reportsAnOptionalTaggedTemplateWithSubstitutions(): void {
    const content = "left?.`a${value}b`";
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTaggedTemplateExpressionNode);
    Assert.isDefined(node.questionDotNode);
    Assert.areEqual(6, node.templateNode.span.startOffset);
    Assert.areEqual(content.length, node.templateNode.span.endOffset);
    Assert.areEqual(1, TypeScriptGrammarFixture.getDiagnostics(parser).length);
    Assert.areEqual("TS1358", TypeScriptGrammarFixture.getDiagnostics(parser)[0]?.code.displayText);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public isATemplateStart(): void {
    const node = new TypeScriptTemplateHeadNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.isTypeScriptTemplateStart());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ `a${value}b` /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptTemplateExpressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(25, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left`a${value}b`";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTaggedTemplateExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsATypeAndALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("`a${b}`");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
