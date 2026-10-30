/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptCaretEqualsNode } from "../../models/nodes/operators/typescript-caret-equals.node.js";
import { TypeScriptCaretNode } from "../../models/nodes/operators/typescript-caret.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class CaretLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptCaretEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptCaretNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
