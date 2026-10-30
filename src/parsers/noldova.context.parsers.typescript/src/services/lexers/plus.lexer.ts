/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptPlusEqualsNode } from "../../models/nodes/operators/typescript-plus-equals.node.js";
import { TypeScriptPlusPlusNode } from "../../models/nodes/operators/typescript-plus-plus.node.js";
import { TypeScriptPlusNode } from "../../models/nodes/operators/typescript-plus.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class PlusLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.plus)) {
      reader.advance();
      return new TypeScriptPlusPlusNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptPlusEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptPlusNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
