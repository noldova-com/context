/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAsKeywordNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptSatisfiesKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeCheckExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptTypeCheckKeywordNodeExtensionsTests {
  @TestMethod
  public bindsAsARelationalLeftAssociativeOperator(): void {
    for (const node of [new TypeScriptAsKeywordNode(new SourceSpan(0, 2)), new TypeScriptSatisfiesKeywordNode(new SourceSpan(0, 9))]) {
      Assert.areEqual(TypeScriptOperatorPrecedence.Relational, node.getTypeScriptPrecedence());
      Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
    }
  }

  @TestData("left + right as Value")
  @TestData("left + right satisfies Value")
  @TestMethod
  public waitsUntilHigherPrecedenceOperatorsHaveBeenParsed(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTypeCheckExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("left as Value")
  @TestData("left satisfies Value")
  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(content: string): void {
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTypeCheckExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("left\nas Value")
  @TestData("left\nsatisfies Value")
  @TestMethod
  public endsNoExpressionAcrossALineBreak(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.parseExpression();

    Assert.isFalse(node instanceof TypeScriptTypeCheckExpressionNode);
  }
}
