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
import { RegexBackreferenceNode } from "../../models/nodes/escapes/regex-backreference.node.js";
import { RegexDecimalEscapeNode } from "../../models/nodes/escapes/regex-decimal-escape.node.js";
import { RegexIdentityEscapeNode } from "../../models/nodes/escapes/regex-identity-escape.node.js";
import { RegexLegacyOctalEscapeNode } from "../../models/nodes/escapes/regex-legacy-octal-escape.node.js";
import { RegexNullEscapeNode } from "../../models/nodes/escapes/regex-null-escape.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import type { RegexLexer } from "./regex.lexer.js";

export class NumericEscapeLexer {
  private static readonly MAXIMUM_FOLLOWING_OCTAL_DIGITS: number = 2;
  private static readonly OCTAL_RADIX: number = 8;

  public lex(lexer: RegexLexer, startOffset: number, firstDigit: string): Node {
    return firstDigit === Resources.digitZero
      ? this.lexZero(lexer, startOffset)
      : this.lexDecimal(lexer, startOffset, firstDigit);
  }

  private createIdentity(lexer: RegexLexer, startOffset: number, character: string): RegexIdentityEscapeNode {
    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    return new RegexIdentityEscapeNode(lexer.reader.source.getText(span), character.charCodeAt(0), span);
  }

  private lexDecimal(lexer: RegexLexer, startOffset: number, firstDigit: string): Node {
    const followingDigits = lexer.reader.peekWhile(String.isAsciiDigit).toString();
    const digits = firstDigit + followingDigits;
    const decimalValue = BigInt(digits);
    const groupCount = lexer.capturingGroupCount;

    if (lexer.isInCharacterClass) {
      if (lexer.unicodeMode) {
        lexer.reader.advance(followingDigits.length);
        const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
        lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1035, span);
        return new RegexDecimalEscapeNode(lexer.reader.source.getText(span), decimalValue, span);
      }

      return String.isAsciiOctalDigit(firstDigit)
        ? this.lexLegacyOctal(lexer, startOffset, firstDigit)
        : this.createIdentity(lexer, startOffset, firstDigit);
    }

    if (decimalValue <= BigInt(groupCount)) {
      lexer.reader.advance(followingDigits.length);
      const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
      return new RegexBackreferenceNode(lexer.reader.source.getText(span), Number(decimalValue), span);
    }

    if (lexer.unicodeMode) {
      const diagnosticSpan = lexer.reader.createSpan(startOffset + Resources.backslash.length, digits.length);
      lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1017, diagnosticSpan, [digits, groupCount]);
      lexer.reader.advance(followingDigits.length);
      const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
      return new RegexDecimalEscapeNode(lexer.reader.source.getText(span), decimalValue, span);
    }

    return String.isAsciiOctalDigit(firstDigit)
      ? this.lexLegacyOctal(lexer, startOffset, firstDigit)
      : this.createIdentity(lexer, startOffset, firstDigit);
  }

  private lexLegacyOctal(lexer: RegexLexer, startOffset: number, firstDigit: string): RegexLegacyOctalEscapeNode {
    const maximumFollowingDigits = firstDigit <= Resources.digitThree
      ? NumericEscapeLexer.MAXIMUM_FOLLOWING_OCTAL_DIGITS
      : NumericEscapeLexer.MAXIMUM_FOLLOWING_OCTAL_DIGITS - 1;

    for (let index = 0; index < maximumFollowingDigits; index++) {
      if (!String.isAsciiOctalDigit(lexer.reader.peekCodeUnit()))
        break;

      lexer.reader.advance();
    }

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    const value = lexer.reader.source.getText(span);
    return new RegexLegacyOctalEscapeNode(value, Number.parseInt(value.substring(Resources.backslash.length), NumericEscapeLexer.OCTAL_RADIX), span);
  }

  private lexZero(lexer: RegexLexer, startOffset: number): Node {
    const followingCharacter = lexer.reader.peekCodeUnit();
    if (lexer.unicodeMode && String.isAsciiDigit(followingCharacter)) {
      const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
      lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1014, span);
      return new RegexUnknownNode(lexer.reader.source.getText(span), span);
    }

    if (!lexer.unicodeMode && String.isAsciiOctalDigit(followingCharacter))
      return this.lexLegacyOctal(lexer, startOffset, Resources.digitZero);

    return new RegexNullEscapeNode(lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset));
  }
}
