/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptPercentEqualsNode } from "../../models/nodes/operators/typescript-percent-equals.node.js";
import { TypeScriptPercentNode } from "../../models/nodes/operators/typescript-percent.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class PercentLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptPercentEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptPercentNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
