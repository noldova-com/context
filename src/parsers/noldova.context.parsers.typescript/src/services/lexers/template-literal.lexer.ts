/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LiteralNode, Node } from "@noldova/context.parsers";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import { TypeScriptTemplateHeadNode } from "../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptTemplateMiddleNode } from "../../models/nodes/literals/typescript-template-middle.node.js";
import { TypeScriptTemplateTailNode } from "../../models/nodes/literals/typescript-template-tail.node.js";
import { Resources } from "../../resources.js";
import { TypeScriptEscapeSequenceReader } from "./readers/typescript-escape-sequence.reader.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class TemplateLiteralLexer {
  private readonly escapeSequenceReader: TypeScriptEscapeSequenceReader = new TypeScriptEscapeSequenceReader();

  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): LiteralNode {
    return this.read(lexer, leadingTrivia, false);
  }

  public reLexUntagged(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): LiteralNode {
    return this.read(lexer, leadingTrivia, true);
  }

  public lexContinuation(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, isTaggedTemplate: boolean): LiteralNode {
    return this.read(lexer, leadingTrivia, !isTaggedTemplate);
  }

  private read(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, shouldReportInvalidEscapes: boolean): LiteralNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    const isInitialToken = reader.peekCodeUnit() === Resources.backtick;
    reader.advance();
    let containsInvalidEscape = false;

    while (!reader.isAtEnd) {
      const character = reader.peekCodeUnit();
      if (character === Resources.backtick) {
        reader.advance();
        return this.createTerminalNode(lexer, leadingTrivia, startOffset, isInitialToken, containsInvalidEscape);
      }

      if (character === Resources.dollar && reader.peekCodeUnit(1) === Resources.openBrace) {
        reader.advance(Resources.dollar.length + Resources.openBrace.length);
        return this.createSubstitutionNode(lexer, leadingTrivia, startOffset, isInitialToken, containsInvalidEscape);
      }

      if (character === Resources.backslash) {
        if (this.escapeSequenceReader.read(lexer, shouldReportInvalidEscapes))
          containsInvalidEscape = true;
        continue;
      }

      reader.readCodePoint();
    }

    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1160, reader.createSpan(reader.currentOffset, 0));
    return this.createTerminalNode(lexer, leadingTrivia, startOffset, isInitialToken, containsInvalidEscape);
  }

  private createTerminalNode(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number, isInitialToken: boolean,
    containsInvalidEscape: boolean): LiteralNode {
    const reader = lexer.reader;
    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const value = reader.source.getText(span);

    return isInitialToken
      ? new TypeScriptNoSubstitutionTemplateLiteralNode(value, span, leadingTrivia, undefined, containsInvalidEscape)
      : new TypeScriptTemplateTailNode(value, span, leadingTrivia);
  }

  private createSubstitutionNode(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number, isInitialToken: boolean,
    containsInvalidEscape: boolean): LiteralNode {
    const reader = lexer.reader;
    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const value = reader.source.getText(span);

    return isInitialToken
      ? new TypeScriptTemplateHeadNode(value, span, leadingTrivia, undefined, containsInvalidEscape)
      : new TypeScriptTemplateMiddleNode(value, span, leadingTrivia);
  }
}
