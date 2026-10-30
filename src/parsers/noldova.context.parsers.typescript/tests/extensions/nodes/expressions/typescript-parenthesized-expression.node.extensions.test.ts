/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParenthesizedExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptParenthesizedExpressionNodeExtensionsTests {
  @TestMethod
  public identifiesItsLeftHandSideGrammarForm(): void {
    const parser = TypeScriptParserFixture.create("(value)");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
