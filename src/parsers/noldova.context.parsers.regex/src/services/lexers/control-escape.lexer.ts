/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import "@noldova/context.text";

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexClassControlEscapeNode } from "../../models/nodes/escapes/regex-class-control-escape.node.js";
import { RegexControlLetterEscapeNode } from "../../models/nodes/escapes/regex-control-letter-escape.node.js";
import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import type { RegexLexer } from "./regex.lexer.js";

export class ControlEscapeLexer {
  private static readonly CONTROL_CHARACTER_MODULUS: number = 32;

  public lex(lexer: RegexLexer, startOffset: number): Node {
    const character = lexer.reader.peekCodeUnit();
    if (String.isAsciiLetter(character)) {
      lexer.reader.advance();
      return new RegexControlLetterEscapeNode(
        lexer.reader.source.getText(startOffset, lexer.reader.currentOffset - startOffset),
        character.charCodeAt(0) % ControlEscapeLexer.CONTROL_CHARACTER_MODULUS,
        lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset));
    }

    const isClassControl = lexer.isInCharacterClass
      && !lexer.unicodeMode
      && (String.isAsciiDigit(character) || character === Resources.underscore);
    if (isClassControl) {
      lexer.reader.advance();
      return new RegexClassControlEscapeNode(
        lexer.reader.source.getText(startOffset, lexer.reader.currentOffset - startOffset),
        character.charCodeAt(0) % ControlEscapeLexer.CONTROL_CHARACTER_MODULUS,
        lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset));
    }

    if (!lexer.unicodeMode) {
      lexer.reader.seek(startOffset + Resources.backslash.length);
      return new RegexCharacterNode(Resources.backslash, lexer.reader.createSpan(startOffset, Resources.backslash.length));
    }

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1014, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }
}
