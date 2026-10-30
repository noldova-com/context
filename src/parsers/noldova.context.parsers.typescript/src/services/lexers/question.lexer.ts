/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Node, ValueNode } from "@noldova/context.parsers";
import "@noldova/context.text";

import { TypeScriptQuestionDotNode } from "../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptQuestionQuestionEqualsNode } from "../../models/nodes/operators/typescript-question-question-equals.node.js";
import { TypeScriptQuestionQuestionNode } from "../../models/nodes/operators/typescript-question-question.node.js";
import { TypeScriptQuestionNode } from "../../models/nodes/operators/typescript-question.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class QuestionLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.dot) && !String.isAsciiDigit(reader.peekCodeUnit(1))) {
      reader.advance();
      return new TypeScriptQuestionDotNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.question)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptQuestionQuestionEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptQuestionQuestionNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptQuestionNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
