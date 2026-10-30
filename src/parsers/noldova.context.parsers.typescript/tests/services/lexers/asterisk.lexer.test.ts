/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptAsteriskAsteriskEqualsNode,
  TypeScriptAsteriskAsteriskNode,
  TypeScriptAsteriskEqualsNode,
  TypeScriptAsteriskNode
} from "@noldova/context.parsers.typescript";
import { TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class AsteriskLexerTests {
  @TestData("*", TypeScriptAsteriskNode)
  @TestData("**", TypeScriptAsteriskAsteriskNode)
  @TestData("*=", TypeScriptAsteriskEqualsNode)
  @TestData("**=", TypeScriptAsteriskAsteriskEqualsNode)
  @TestMethod
  public lexesEveryAsteriskOperator(value: string, expectedType: Function & NodeType): void {
    TypeScriptLexerFixture.assertLexes(value, expectedType);
  }
}
