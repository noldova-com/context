/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source } from "@noldova/context.parsers";
import { TypeScriptDotDotDotNode, TypeScriptDotNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class DotLexerTests {
  @TestData(".", TypeScriptDotNode)
  @TestData("...", TypeScriptDotDotDotNode)
  @TestMethod
  public lexesDotAndDotDotDot(value: string, expectedType: Function & NodeType): void {
    TypeScriptLexerFixture.assertLexes(value, expectedType);
  }

  @TestMethod
  public leavesAnIncompleteDotDotUnread(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("..", "source.ts"));
    const result = lexer.lex();

    Assert.isInstanceOf(result, TypeScriptDotNode);
    Assert.areEqual(1, lexer.reader.currentOffset);
    Assert.isUndefined(result.leadingTrivia);
  }
}
