/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptLessThanEqualsNode } from "../../models/nodes/operators/typescript-less-than-equals.node.js";
import { TypeScriptLessThanNode } from "../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptShiftLeftEqualsNode } from "../../models/nodes/operators/typescript-shift-left-equals.node.js";
import { TypeScriptShiftLeftNode } from "../../models/nodes/operators/typescript-shift-left.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class LessThanLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.lessThan)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptShiftLeftEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptShiftLeftNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptLessThanEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptLessThanNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }

  public reLex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): TypeScriptLessThanNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();
    return new TypeScriptLessThanNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
