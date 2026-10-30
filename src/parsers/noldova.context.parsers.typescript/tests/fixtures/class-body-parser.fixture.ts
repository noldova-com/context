/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptClassBodyNode, TypeScriptClassExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "./typescript-parser.fixture.js";

export class ClassBodyParserFixture {
  public static parse(input: string): TypeScriptClassBodyNode {
    const parser = TypeScriptParserFixture.create(input);
    const classExpressionNode = parser.parseExpression();
    Assert.isInstanceOf(classExpressionNode, TypeScriptClassExpressionNode);
    return classExpressionNode.bodyNode;
  }
}
