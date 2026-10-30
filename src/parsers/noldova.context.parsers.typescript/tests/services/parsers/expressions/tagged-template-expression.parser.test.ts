/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTaggedTemplateExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TaggedTemplateExpressionParserTests {
  @TestMethod
  public parsesTaggedTemplatesWithAndWithoutTypeArguments(): void {
    const taggedNode = TypeScriptParserFixture.create("tag`text`").parseExpression();
    const substitutedNode = TypeScriptParserFixture.create("tag`text${value}`").parseExpression();
    const typedNode = TypeScriptParserFixture.create("tag<Value>`text`").parseExpression();
    const typedSubstitutedNode = TypeScriptParserFixture.create("tag<Value>`text${value}`").parseExpression();

    Assert.isInstanceOf(taggedNode, TypeScriptTaggedTemplateExpressionNode);
    Assert.isInstanceOf(substitutedNode, TypeScriptTaggedTemplateExpressionNode);
    Assert.isInstanceOf(typedNode, TypeScriptTaggedTemplateExpressionNode);
    Assert.isInstanceOf(typedSubstitutedNode, TypeScriptTaggedTemplateExpressionNode);
  }
}
