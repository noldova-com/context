/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptSatisfiesExpressionNode, TypeScriptSatisfiesKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptSatisfiesKeywordNodeExtensionsTests {
  @TestMethod
  public createsItsOwnExpressionHoldingItself(): void {
    const parser = TypeScriptParserFixture.create("left satisfies Value");

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptSatisfiesExpressionNode);
    Assert.isInstanceOf(node.satisfiesKeywordNode, TypeScriptSatisfiesKeywordNode);
    Assert.areEqual(5, node.satisfiesKeywordNode.span.startOffset);
  }
}
