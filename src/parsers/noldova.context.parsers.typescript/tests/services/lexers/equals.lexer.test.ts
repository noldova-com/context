/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import { TypeScriptArrowNode, TypeScriptEqualsEqualsEqualsNode, TypeScriptEqualsEqualsNode, TypeScriptEqualsNode } from "@noldova/context.parsers.typescript";
import { TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class EqualsLexerTests {
  @TestData("=", TypeScriptEqualsNode)
  @TestData("==", TypeScriptEqualsEqualsNode)
  @TestData("===", TypeScriptEqualsEqualsEqualsNode)
  @TestData("=>", TypeScriptArrowNode)
  @TestMethod
  public lexesEveryEqualsOperator(value: string, expectedType: Function & NodeType): void {
    TypeScriptLexerFixture.assertLexes(value, expectedType);
  }
}
