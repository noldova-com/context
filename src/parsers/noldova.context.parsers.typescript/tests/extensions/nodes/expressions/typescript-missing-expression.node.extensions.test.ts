/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExpressionStatementNode, TypeScriptIdentifierNode, TypeScriptMissingExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptMissingExpressionNodeExtensionsTests {
  @TestMethod
  public doesNotReportASeparatorForAnExpressionAlreadyMissing(): void {
    const parser = TypeScriptParserFixture.create(") values;");
    const missingExpression = parser.parseExpression();
    Assert.isInstanceOf(missingExpression, TypeScriptMissingExpressionNode);
    parser.advance();
    missingExpression.reportTypeScriptMissingSemicolon(parser);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics[0]?.location?.start);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[0]?.location?.length);
    const followingStatement = parser.parseStatement();
    Assert.isInstanceOf(followingStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(followingStatement.expressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("values", followingStatement.expressionNode.value);
  }

  @TestMethod
  public readsAsALeftHandSideExpression(): void {
    const missingExpression = TypeScriptParserFixture.create(") values;").parseExpression();

    Assert.isInstanceOf(missingExpression, TypeScriptMissingExpressionNode);
    Assert.isTrue(missingExpression.isTypeScriptLeftHandSideExpression());
  }
}
