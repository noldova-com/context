/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptGreaterThanEqualsNode } from "../../models/nodes/operators/typescript-greater-than-equals.node.js";
import { TypeScriptGreaterThanNode } from "../../models/nodes/operators/typescript-greater-than.node.js";
import { TypeScriptShiftRightEqualsNode } from "../../models/nodes/operators/typescript-shift-right-equals.node.js";
import { TypeScriptShiftRightNode } from "../../models/nodes/operators/typescript-shift-right.node.js";
import { TypeScriptUnsignedShiftRightEqualsNode } from "../../models/nodes/operators/typescript-unsigned-shift-right-equals.node.js";
import { TypeScriptUnsignedShiftRightNode } from "../../models/nodes/operators/typescript-unsigned-shift-right.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class GreaterThanLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): TypeScriptGreaterThanNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();
    return new TypeScriptGreaterThanNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }

  public reLex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.greaterThan)) {
      reader.advance();

      if (reader.startsWith(Resources.greaterThan)) {
        reader.advance();

        if (reader.startsWith(Resources.equals)) {
          reader.advance();
          return new TypeScriptUnsignedShiftRightEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
        }

        return new TypeScriptUnsignedShiftRightNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptShiftRightEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptShiftRightNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptGreaterThanEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptGreaterThanNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
