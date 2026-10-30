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
import { RegexHexEscapeNode } from "../../models/nodes/escapes/regex-hex-escape.node.js";
import { RegexIdentityEscapeNode } from "../../models/nodes/escapes/regex-identity-escape.node.js";
import { RegexUnicodeEscapeNode } from "../../models/nodes/escapes/regex-unicode-escape.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import { RegexUnicodeEscapeReader } from "../readers/regex-unicode-escape.reader.js";
import { RegexIdentityEscapeValidator } from "../validators/regex-identity-escape.validator.js";
import type { RegexLexer } from "./regex.lexer.js";

export class CodePointEscapeLexer {
  private static readonly HEXADECIMAL_DIGIT_COUNT: number = 2;
  private static readonly HEXADECIMAL_RADIX: number = 16;

  private readonly identityEscapeValidator: RegexIdentityEscapeValidator = new RegexIdentityEscapeValidator();
  private readonly unicodeEscapeReader: RegexUnicodeEscapeReader = new RegexUnicodeEscapeReader();

  public lexHexadecimal(lexer: RegexLexer, startOffset: number): Node {
    const continuationOffset = lexer.reader.currentOffset;
    const digitStartOffset = continuationOffset;

    for (let index = 0; index < CodePointEscapeLexer.HEXADECIMAL_DIGIT_COUNT; index++) {
      if (!String.isAsciiHexDigit(lexer.reader.peekCodeUnit()))
        return this.createFallback(lexer, startOffset, continuationOffset, Resources.hexEscapeCharacter);

      lexer.reader.advance();
    }

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    const digits = lexer.reader.source.getText(digitStartOffset, lexer.reader.currentOffset - digitStartOffset);
    return new RegexHexEscapeNode(lexer.reader.source.getText(span), Number.parseInt(digits, CodePointEscapeLexer.HEXADECIMAL_RADIX), span);
  }

  public lexUnicode(lexer: RegexLexer, startOffset: number): Node {
    const continuationOffset = lexer.reader.currentOffset;
    lexer.reader.seek(startOffset);
    const escape = this.unicodeEscapeReader.read(lexer.reader, lexer.unicodeMode || lexer.isInGroupName);
    if (!Object.isUndefined(escape)) {
      const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
      return new RegexUnicodeEscapeNode(escape.value, escape.codePoint, span);
    }

    return this.createFallback(lexer, startOffset, continuationOffset, Resources.unicodeEscapeCharacter);
  }

  private createFallback(lexer: RegexLexer, startOffset: number, continuationOffset: number, character: string): Node {
    if (this.identityEscapeValidator.isValid(lexer, character)) {
      lexer.reader.seek(continuationOffset);
      const span = lexer.reader.createSpan(startOffset, continuationOffset - startOffset);
      return new RegexIdentityEscapeNode(lexer.reader.source.getText(span), character.charCodeAt(0), span);
    }

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1014, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }
}
