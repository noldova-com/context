/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptAmpersandAmpersandEqualsNode } from "../../models/nodes/operators/typescript-ampersand-ampersand-equals.node.js";
import { TypeScriptAmpersandAmpersandNode } from "../../models/nodes/operators/typescript-ampersand-ampersand.node.js";
import { TypeScriptAmpersandEqualsNode } from "../../models/nodes/operators/typescript-ampersand-equals.node.js";
import { TypeScriptAmpersandNode } from "../../models/nodes/operators/typescript-ampersand.node.js";
import { Resources } from "../../resources.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class AmpersandLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.startsWith(Resources.ampersand)) {
      reader.advance();

      if (reader.startsWith(Resources.equals)) {
        reader.advance();
        return new TypeScriptAmpersandAmpersandEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
      }

      return new TypeScriptAmpersandAmpersandNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    if (reader.startsWith(Resources.equals)) {
      reader.advance();
      return new TypeScriptAmpersandEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptAmpersandNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }
}
