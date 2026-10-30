/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import { TypeScriptPlusEqualsNode, TypeScriptPlusNode, TypeScriptPlusPlusNode } from "@noldova/context.parsers.typescript";
import { TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class PlusLexerTests {
  @TestData("+", TypeScriptPlusNode)
  @TestData("++", TypeScriptPlusPlusNode)
  @TestData("+=", TypeScriptPlusEqualsNode)
  @TestMethod
  public lexesEveryPlusOperator(value: string, expectedType: Function & NodeType): void {
    TypeScriptLexerFixture.assertLexes(value, expectedType);
  }
}
