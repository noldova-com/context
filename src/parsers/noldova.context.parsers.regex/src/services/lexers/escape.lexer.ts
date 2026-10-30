/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import "@noldova/context.text";

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexNonWordBoundaryAssertionNode } from "../../models/nodes/assertions/regex-non-word-boundary-assertion.node.js";
import { RegexWordBoundaryAssertionNode } from "../../models/nodes/assertions/regex-word-boundary-assertion.node.js";
import { RegexBackspaceEscapeNode } from "../../models/nodes/escapes/regex-backspace-escape.node.js";
import { RegexCarriageReturnEscapeNode } from "../../models/nodes/escapes/regex-carriage-return-escape.node.js";
import { RegexDigitEscapeNode } from "../../models/nodes/escapes/regex-digit-escape.node.js";
import { RegexFormFeedEscapeNode } from "../../models/nodes/escapes/regex-form-feed-escape.node.js";
import { RegexIdentityEscapeNode } from "../../models/nodes/escapes/regex-identity-escape.node.js";
import { RegexNewlineEscapeNode } from "../../models/nodes/escapes/regex-newline-escape.node.js";
import { RegexNonDigitEscapeNode } from "../../models/nodes/escapes/regex-non-digit-escape.node.js";
import { RegexNonWhitespaceEscapeNode } from "../../models/nodes/escapes/regex-non-whitespace-escape.node.js";
import { RegexNonWordEscapeNode } from "../../models/nodes/escapes/regex-non-word-escape.node.js";
import { RegexTabEscapeNode } from "../../models/nodes/escapes/regex-tab-escape.node.js";
import { RegexVerticalTabEscapeNode } from "../../models/nodes/escapes/regex-vertical-tab-escape.node.js";
import { RegexWhitespaceEscapeNode } from "../../models/nodes/escapes/regex-whitespace-escape.node.js";
import { RegexWordEscapeNode } from "../../models/nodes/escapes/regex-word-escape.node.js";
import { RegexClassStringDisjunctionStartNode } from "../../models/nodes/punctuators/regex-class-string-disjunction-start.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import { RegexIdentityEscapeValidator } from "../validators/regex-identity-escape.validator.js";
import { CodePointEscapeLexer } from "./code-point-escape.lexer.js";
import { ControlEscapeLexer } from "./control-escape.lexer.js";
import { NamedBackreferenceLexer } from "./named-backreference.lexer.js";
import { NumericEscapeLexer } from "./numeric-escape.lexer.js";
import type { RegexLexer } from "./regex.lexer.js";
import { UnicodePropertyEscapeLexer } from "./unicode-property-escape.lexer.js";

export class EscapeLexer {
  private readonly codePointEscapeLexer: CodePointEscapeLexer = new CodePointEscapeLexer();
  private readonly controlEscapeLexer: ControlEscapeLexer = new ControlEscapeLexer();
  private readonly identityEscapeValidator: RegexIdentityEscapeValidator = new RegexIdentityEscapeValidator();
  private readonly namedBackreferenceLexer: NamedBackreferenceLexer = new NamedBackreferenceLexer();
  private readonly numericEscapeLexer: NumericEscapeLexer = new NumericEscapeLexer();
  private readonly unicodePropertyEscapeLexer: UnicodePropertyEscapeLexer = new UnicodePropertyEscapeLexer();

  public lex(lexer: RegexLexer): Node {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance();

    if (reader.isAtEnd)
      return this.createUnknown(lexer, startOffset);

    const codePoint = lexer.unicodeMode ? reader.readCodePoint() : reader.readCodeUnit().charCodeAt(0);
    const character = String.fromCodePoint(codePoint);
    switch (character) {
      case Resources.digitEscapeCharacter:
        return new RegexDigitEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.nonDigitEscapeCharacter:
        return new RegexNonDigitEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.wordEscapeCharacter:
        return new RegexWordEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.nonWordEscapeCharacter:
        return new RegexNonWordEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.whitespaceEscapeCharacter:
        return new RegexWhitespaceEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.nonWhitespaceEscapeCharacter:
        return new RegexNonWhitespaceEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.formFeedEscapeCharacter:
        return new RegexFormFeedEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.newlineEscapeCharacter:
        return new RegexNewlineEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.carriageReturnEscapeCharacter:
        return new RegexCarriageReturnEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.tabEscapeCharacter:
        return new RegexTabEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.verticalTabEscapeCharacter:
        return new RegexVerticalTabEscapeNode(this.createSpan(lexer, startOffset));
      case Resources.backspaceEscapeCharacter:
        return lexer.isInCharacterClass
          ? new RegexBackspaceEscapeNode(this.createSpan(lexer, startOffset))
          : new RegexWordBoundaryAssertionNode(this.createSpan(lexer, startOffset));
      case Resources.nonWordBoundaryEscapeCharacter:
        if (!lexer.isInCharacterClass)
          return new RegexNonWordBoundaryAssertionNode(this.createSpan(lexer, startOffset));
        break;
      case Resources.classControlEscapeCharacter:
        return this.controlEscapeLexer.lex(lexer, startOffset);
      case Resources.digitZero:
        return this.numericEscapeLexer.lex(lexer, startOffset, character);
      case Resources.hexEscapeCharacter:
        return this.codePointEscapeLexer.lexHexadecimal(lexer, startOffset);
      case Resources.unicodeEscapeCharacter:
        return this.codePointEscapeLexer.lexUnicode(lexer, startOffset);
      case Resources.unicodePropertyEscapeCharacter:
        return lexer.unicodeMode
          ? this.unicodePropertyEscapeLexer.lex(lexer, startOffset, false)
          : this.createIdentity(lexer, startOffset, codePoint);
      case Resources.negatedUnicodePropertyEscapeCharacter:
        return lexer.unicodeMode
          ? this.unicodePropertyEscapeLexer.lex(lexer, startOffset, true)
          : this.createIdentity(lexer, startOffset, codePoint);
      case Resources.namedBackreferenceEscapeCharacter:
        return this.namedBackreferenceLexer.lex(lexer, startOffset, codePoint);
      case Resources.classStringDisjunctionEscapeCharacter:
        return this.lexClassStringDisjunctionStart(lexer, startOffset, codePoint);
    }

    if (String.isAsciiDigit(character))
      return this.numericEscapeLexer.lex(lexer, startOffset, character);

    if (this.identityEscapeValidator.isValid(lexer, character))
      return this.createIdentity(lexer, startOffset, codePoint);

    return this.createUnknown(lexer, startOffset);
  }

  private createIdentity(lexer: RegexLexer, startOffset: number, codePoint: number): RegexIdentityEscapeNode {
    const span = this.createSpan(lexer, startOffset);
    return new RegexIdentityEscapeNode(lexer.reader.source.getText(span), codePoint, span);
  }

  private createSpan(lexer: RegexLexer, startOffset: number): SourceSpan {
    return lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
  }

  private createUnknown(lexer: RegexLexer, startOffset: number): RegexUnknownNode {
    const span = this.createSpan(lexer, startOffset);
    lexer.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1014, span);
    return new RegexUnknownNode(lexer.reader.source.getText(span), span);
  }

  private lexClassStringDisjunctionStart(lexer: RegexLexer, startOffset: number, codePoint: number): Node {
    if (lexer.isInCharacterClass && lexer.unicodeSetsMode && lexer.reader.peekCodeUnit() === Resources.openBrace) {
      lexer.reader.advance();
      return new RegexClassStringDisjunctionStartNode(this.createSpan(lexer, startOffset));
    }

    return this.identityEscapeValidator.isValid(lexer, Resources.classStringDisjunctionEscapeCharacter)
      ? this.createIdentity(lexer, startOffset, codePoint)
      : this.createUnknown(lexer, startOffset);
  }
}
