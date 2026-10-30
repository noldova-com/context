/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source } from "@noldova/context.parsers";
import {
  TypeScriptQuestionDotNode,
  TypeScriptQuestionNode,
  TypeScriptQuestionQuestionEqualsNode,
  TypeScriptQuestionQuestionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class QuestionLexerTests {
  @TestData("?", TypeScriptQuestionNode)
  @TestData("?.", TypeScriptQuestionDotNode)
  @TestData("??", TypeScriptQuestionQuestionNode)
  @TestData("??=", TypeScriptQuestionQuestionEqualsNode)
  @TestMethod
  public lexesEveryQuestionOperator(value: string, expectedType: Function & NodeType): void {
    TypeScriptLexerFixture.assertLexes(value, expectedType);
  }

  @TestMethod
  public lexesQuestionDotAtEndOfSource(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("?.", "source.ts"));
    const result = lexer.lex();

    Assert.isInstanceOf(result, TypeScriptQuestionDotNode);
    Assert.areEqual(2, lexer.reader.currentOffset);
  }

  @TestMethod
  public leavesDotBeforeDecimalDigitUnread(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("?.5", "source.ts"));
    const result = lexer.lex();

    Assert.isInstanceOf(result, TypeScriptQuestionNode);
    Assert.areEqual(1, lexer.reader.currentOffset);
    Assert.isUndefined(result.leadingTrivia);
  }
}
