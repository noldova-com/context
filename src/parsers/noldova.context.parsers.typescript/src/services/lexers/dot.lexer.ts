/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptDotDotDotNode } from "../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptDotNode } from "../../models/nodes/delimiters/typescript-dot.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class DotLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.dotDot)) {
      reader.advance(Resources.dotDot.length);
      return new TypeScriptDotDotDotNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptDotNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
