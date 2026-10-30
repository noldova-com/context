/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptArrowNode } from "../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptEqualsEqualsEqualsNode } from "../../models/nodes/operators/typescript-equals-equals-equals.node.js";
import { TypeScriptEqualsEqualsNode } from "../../models/nodes/operators/typescript-equals-equals.node.js";
import { TypeScriptEqualsNode } from "../../models/nodes/operators/typescript-equals.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class EqualsLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.equals)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptEqualsEqualsEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptEqualsEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.greaterThan)) {
      reader.advance();
      return new TypeScriptArrowNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
