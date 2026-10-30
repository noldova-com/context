/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptMinusEqualsNode } from "../../models/nodes/operators/typescript-minus-equals.node.js";
import { TypeScriptMinusMinusNode } from "../../models/nodes/operators/typescript-minus-minus.node.js";
import { TypeScriptMinusNode } from "../../models/nodes/operators/typescript-minus.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class MinusLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.minus)) {
      reader.advance();
      return new TypeScriptMinusMinusNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptMinusEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptMinusNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
