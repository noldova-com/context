/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptExclamationEqualsEqualsNode } from "../../models/nodes/operators/typescript-exclamation-equals-equals.node.js";
import { TypeScriptExclamationEqualsNode } from "../../models/nodes/operators/typescript-exclamation-equals.node.js";
import { TypeScriptExclamationNode } from "../../models/nodes/operators/typescript-exclamation.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class ExclamationLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.equals)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptExclamationEqualsEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptExclamationEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptExclamationNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
