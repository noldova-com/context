/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import "../../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptLexer } from "../typescript.lexer.js";

export class TypeScriptEscapeSequenceReader {
  private readonly lineTerminator: EcmaScriptLineTerminator = new EcmaScriptLineTerminator();

  public read(lexer: TypeScriptLexer, shouldReportInvalidEscapes: boolean): boolean {
    const reader = lexer.reader;

    if (reader.startsWith(Resources.hexadecimalEscapePrefix)) {
      reader.advance(Resources.hexadecimalEscapePrefix.length);
      return this.readFixedHexadecimalDigits(lexer, Resources.hexadecimalEscapeDigitCount, shouldReportInvalidEscapes);
    }

    if (reader.startsWith(Resources.unicodeEscapePrefix)) {
      reader.advance(Resources.unicodeEscapePrefix.length);
      return this.readUnicodeEscape(lexer, shouldReportInvalidEscapes);
    }

    const startOffset = reader.currentOffset;
    reader.advance(Resources.backslash.length);

    if (reader.isAtEnd) {
      this.report(lexer, TypeScriptDiagnosticTemplates.TS1126, reader.currentOffset, 0);
      return false;
    }

    const lineBreakLength = this.lineTerminator.getLength(reader.source.content, reader.currentOffset);
    if (lineBreakLength > 0) {
      reader.advance(lineBreakLength);
      return false;
    }

    const character = reader.peekCodeUnit();
    if (String.isAsciiOctalDigit(character)) {
      if (character === Resources.digitZero && !String.isAsciiDigit(reader.peekCodeUnit(1))) {
        reader.advance();
        return false;
      }

      this.readLegacyOctalEscape(lexer, startOffset, character, shouldReportInvalidEscapes);
      return true;
    }

    if (String.isAsciiDigit(character)) {
      reader.advance();
      if (shouldReportInvalidEscapes) {
        const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
        const value = reader.source.getText(span);
        lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1488, span, [value]);
      }
      return true;
    }

    reader.readCodePoint();
    return false;
  }

  private readLegacyOctalEscape(lexer: TypeScriptLexer, startOffset: number, firstCharacter: string, shouldReportInvalidEscapes: boolean): void {
    const reader = lexer.reader;
    const firstDigit = Number.parseInt(firstCharacter, Resources.octalRadix);
    reader.advance();

    if (firstDigit <= Resources.maximumThreeDigitOctalEscapeLeadingDigit && String.isAsciiOctalDigit(reader.peekCodeUnit()))
      reader.advance();

    if (String.isAsciiOctalDigit(reader.peekCodeUnit()))
      reader.advance();

    if (!shouldReportInvalidEscapes)
      return;

    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const digitStartOffset = startOffset + Resources.backslash.length;
    const digits = reader.source.getText(digitStartOffset, reader.currentOffset - digitStartOffset);
    const value = Number.parseInt(digits, Resources.octalRadix);
    const hexadecimal = value.toString(Resources.hexadecimalRadix).padStart(Resources.hexadecimalEscapeDigitCount, Resources.digitZero);
    const suggestion = Resources.hexadecimalEscapePrefix + hexadecimal;
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1487, span, [suggestion]);
  }

  private readUnicodeEscape(lexer: TypeScriptLexer, shouldReportInvalidEscapes: boolean): boolean {
    const reader = lexer.reader;
    if (reader.peekCodeUnit() !== Resources.openBrace)
      return this.readFixedHexadecimalDigits(lexer, Resources.unicodeEscapeDigitCount, shouldReportInvalidEscapes);

    reader.advance(Resources.openBrace.length);
    const digitStartOffset = reader.currentOffset;
    reader.readWhile(String.isAsciiHexDigit);
    const digitCount = reader.currentOffset - digitStartOffset;

    if (digitCount === 0) {
      if (shouldReportInvalidEscapes)
        this.report(lexer, TypeScriptDiagnosticTemplates.TS1125, reader.currentOffset, 0);
      return true;
    }

    const isOutOfRange = Number.parseInt(reader.source.getText(digitStartOffset, digitCount), Resources.hexadecimalRadix) > Resources.maximumUnicodeCodePoint;
    if (isOutOfRange && shouldReportInvalidEscapes)
      this.report(lexer, TypeScriptDiagnosticTemplates.TS1198, digitStartOffset, digitCount);

    if (reader.isAtEnd) {
      if (shouldReportInvalidEscapes)
        this.report(lexer, TypeScriptDiagnosticTemplates.TS1126, reader.currentOffset, 0);
      return true;
    }

    if (reader.peekCodeUnit() === Resources.closeBrace) {
      reader.advance(Resources.closeBrace.length);
      return isOutOfRange;
    }

    if (shouldReportInvalidEscapes)
      this.report(lexer, TypeScriptDiagnosticTemplates.TS1199, reader.currentOffset, 0);
    return true;
  }

  private readFixedHexadecimalDigits(lexer: TypeScriptLexer, digitCount: number, shouldReportInvalidEscapes: boolean): boolean {
    const reader = lexer.reader;

    for (let index = 0; index < digitCount; index++) {
      if (!String.isAsciiHexDigit(reader.peekCodeUnit())) {
        if (shouldReportInvalidEscapes)
          this.report(lexer, TypeScriptDiagnosticTemplates.TS1125, reader.currentOffset, 0);
        return true;
      }

      reader.advance();
    }
    return false;
  }

  private report(lexer: TypeScriptLexer, template: DiagnosticTemplate, startOffset: number, length: number): void {
    const span = lexer.reader.createSpan(startOffset, length);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(template, span);
  }
}
