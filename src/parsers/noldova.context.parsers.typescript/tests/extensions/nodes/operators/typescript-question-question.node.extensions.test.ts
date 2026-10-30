/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptBinaryExpressionNode,
  TypeScriptEqualsNode,
  TypeScriptParser,
  TypeScriptQuestionNode,
  TypeScriptQuestionQuestionNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeOperatorNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptQuestionQuestionNodeExtensionsTests {
  @TestMethod
  public bindsAsALeftAssociativeNullishCoalescingOperator(): void {
    const node = new TypeScriptQuestionQuestionNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.NullishCoalescing, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left ?? right";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public permitsCoalescingWithUnrelatedBinaryOperands(): void {
    const result = TypeScriptParser.parse("first + second ?? third * fourth;");
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public readsTwoPrefixQuestionsWhereATypeStarts(): void {
    const parser = TypeScriptParserFixture.create("??number");

    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(node.operatorNode, TypeScriptQuestionNode);
    Assert.areEqual(1, node.operatorNode.span.length);
    Assert.areEqual(8, node.span.length);
    Assert.isInstanceOf(node.typeNode, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(node.typeNode.operatorNode, TypeScriptQuestionNode);
    Assert.areEqual(1, node.typeNode.span.startOffset);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsTheTypeMissingAfterTheSecondQuestion(): void {
    const parser = TypeScriptParserFixture.create("?? = 1");

    parser.parseType();

    Assert.areEqual("TS1110@3:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
    Assert.isInstanceOf(parser.currentNode, TypeScriptEqualsNode);
  }
}
