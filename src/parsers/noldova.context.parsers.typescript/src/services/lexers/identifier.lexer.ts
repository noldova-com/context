/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptIdentifierNode } from "../../models/nodes/identifiers/typescript-identifier.node.js";
import { TypeScriptKeywordNodeFactory } from "../typescript-keyword-node-factory.js";
import { TypeScriptIdentifierValueReader } from "./readers/typescript-identifier-value.reader.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class IdentifierLexer {
  private readonly identifierValueReader: TypeScriptIdentifierValueReader = new TypeScriptIdentifierValueReader();
  private readonly keywordNodeFactory: TypeScriptKeywordNodeFactory = new TypeScriptKeywordNodeFactory();

  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): Node | undefined {
    const startOffset = lexer.reader.currentOffset;
    const value = this.identifierValueReader.read(lexer.reader);
    if (Object.isUndefined(value))
      return undefined;

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    const keyword = this.keywordNodeFactory.create(value, span, leadingTrivia);
    if (!Object.isUndefined(keyword))
      return keyword;

    return new TypeScriptIdentifierNode(value, span, leadingTrivia);
  }
}
