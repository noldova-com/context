/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptMinusNode, TypeScriptPlusNode, TypeScriptPrefixUnaryExpressionNode } from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptMinusNodeExtensionsTests {
  @TestMethod
  public bindsAsALeftAssociativeAdditiveOperator(): void {
    const node = new TypeScriptMinusNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.Additive, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public isAPrefixUnaryOperator(): void {
    const node = new TypeScriptMinusNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptPrefixUnaryOperator());
  }

  @TestMethod
  public parsesItsUnaryExpressionBeforeABinaryOperator(): void {
    const prefix = " /*leading*/ ";
    const content = "-value";
    const parser = TypeScriptParserFixture.create(prefix + content + " + following");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.isInstanceOf(node, TypeScriptPrefixUnaryExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptPlusNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("-1", true)
  @TestData("-1n", true)
  @TestData("-x", false)
  @TestData("-", false)
  @TestMethod
  public startsATypeOnlyAsANegativeNumericLiteral(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.canStartTypeScriptType(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }
}
