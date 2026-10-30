/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptAsteriskAsteriskEqualsNode } from "../../models/nodes/operators/typescript-asterisk-asterisk-equals.node.js";
import { TypeScriptAsteriskAsteriskNode } from "../../models/nodes/operators/typescript-asterisk-asterisk.node.js";
import { TypeScriptAsteriskEqualsNode } from "../../models/nodes/operators/typescript-asterisk-equals.node.js";
import { TypeScriptAsteriskNode } from "../../models/nodes/operators/typescript-asterisk.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class AsteriskLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.asterisk)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptAsteriskAsteriskEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptAsteriskAsteriskNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptAsteriskEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptAsteriskNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
