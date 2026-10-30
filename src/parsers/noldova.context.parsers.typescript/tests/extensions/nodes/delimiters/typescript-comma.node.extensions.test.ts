/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptBinaryExpressionNode, TypeScriptCommaNode, TypeScriptMissingExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCommaNodeExtensionsTests {
  @TestMethod
  public leavesTheCommaForItsEnclosingExpressionAfterAMissingOperand(): void {
    const parser = TypeScriptParserFixture.create(", value");
    const token = parser.currentNode;
    const missing = token.parseTypeScriptPrimaryExpression(parser);
    Assert.isInstanceOf(missing, TypeScriptMissingExpressionNode);
    Assert.areEqual(0, missing.span.length);
    Assert.areEqual(token, parser.currentNode);
    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptBinaryExpressionNode);
    Assert.areEqual(token, expression.operatorNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual("TS1109@0:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public startsNoStatement(): void {
    const parser = TypeScriptParserFixture.create(",");

    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }

  @TestMethod
  public canFollowAnOptionalParameterMarker(): void {
    Assert.isTrue(new TypeScriptCommaNode(new SourceSpan(0, 1)).canFollowTypeScriptOptionalParameterMarker());
  }

  @TestMethod
  public indicatesAFunctionTypeAndAnIndexSignatureParameter(): void {
    const node = new TypeScriptCommaNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptFunctionTypeParameterIndicator());
    Assert.isTrue(node.isTypeScriptIndexSignatureParameterIndicator(TypeScriptParserFixture.create(",")));
  }
}
