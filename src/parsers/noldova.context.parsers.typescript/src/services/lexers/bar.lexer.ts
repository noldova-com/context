/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptBarBarEqualsNode } from "../../models/nodes/operators/typescript-bar-bar-equals.node.js";
import { TypeScriptBarBarNode } from "../../models/nodes/operators/typescript-bar-bar.node.js";
import { TypeScriptBarEqualsNode } from "../../models/nodes/operators/typescript-bar-equals.node.js";
import { TypeScriptBarNode } from "../../models/nodes/operators/typescript-bar.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class BarLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.bar)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptBarBarEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptBarBarNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptBarEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptBarNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
