/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptStringLiteralNode } from "../../models/nodes/literals/typescript-string-literal.node.js";
import { Resources } from "../../resources.js";
import { TypeScriptEscapeSequenceReader } from "./readers/typescript-escape-sequence.reader.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class StringLexer {
  private readonly escapeSequenceReader: TypeScriptEscapeSequenceReader = new TypeScriptEscapeSequenceReader();

  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): TypeScriptStringLiteralNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    const quote = reader.source.content.charAt(startOffset);
    reader.advance();

    while (!reader.isAtEnd) {
      const character = reader.peekCodeUnit();
      if (character === quote) {
        reader.advance();
        return this.createNode(lexer, leadingTrivia, startOffset);
      }

      if (character === Resources.carriageReturn || character === Resources.lineFeed)
        break;

      if (character === Resources.backslash) {
        this.escapeSequenceReader.read(lexer, true);
        continue;
      }

      reader.readCodePoint();
    }

    this.reportUnterminatedString(lexer);
    return this.createNode(lexer, leadingTrivia, startOffset);
  }

  private reportUnterminatedString(lexer: TypeScriptLexer): void {
    const position = lexer.reader.currentOffset;
    const span = lexer.reader.createSpan(position, 0);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1002, span);
  }

  private createNode(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number): TypeScriptStringLiteralNode {
    const reader = lexer.reader;
    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const value = reader.source.getText(span);
    return new TypeScriptStringLiteralNode(value, span, leadingTrivia);
  }
}
