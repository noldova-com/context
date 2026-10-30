/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { LiteralNode, Node } from "@noldova/context.parsers";
import "@noldova/context.text";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBigIntLiteralNode } from "../../models/nodes/literals/typescript-big-int-literal.node.js";
import { TypeScriptNumericLiteralNode } from "../../models/nodes/literals/typescript-numeric-literal.node.js";
import { TypeScriptMinusNode } from "../../models/nodes/operators/typescript-minus.node.js";
import { Resources } from "../../resources.js";
import { TypeScriptIdentifierValueReader } from "./readers/typescript-identifier-value.reader.js";
import { TypeScriptCharacterClassifier } from "./typescript-character-classifier.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class NumericLexer {
  private readonly identifierValueReader: TypeScriptIdentifierValueReader = new TypeScriptIdentifierValueReader();

  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): LiteralNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;

    if (reader.startsWith(Resources.hexadecimalPrefixLowercase) || reader.startsWith(Resources.hexadecimalPrefixUppercase))
      return this.readRadixLiteral(
        lexer,
        leadingTrivia,
        startOffset,
        Resources.hexadecimalPrefixLowercase.length,
        String.isAsciiHexDigit,
        TypeScriptDiagnosticTemplates.TS1125);

    if (reader.startsWith(Resources.binaryPrefixLowercase) || reader.startsWith(Resources.binaryPrefixUppercase))
      return this.readRadixLiteral(
        lexer,
        leadingTrivia,
        startOffset,
        Resources.binaryPrefixLowercase.length,
        String.isAsciiBinaryDigit,
        TypeScriptDiagnosticTemplates.TS1177);

    if (reader.startsWith(Resources.octalPrefixLowercase) || reader.startsWith(Resources.octalPrefixUppercase))
      return this.readRadixLiteral(
        lexer,
        leadingTrivia,
        startOffset,
        Resources.octalPrefixLowercase.length,
        String.isAsciiOctalDigit,
        TypeScriptDiagnosticTemplates.TS1178);

    return this.readDecimalLiteral(lexer, leadingTrivia, startOffset);
  }

  private readRadixLiteral(
    lexer: TypeScriptLexer,
    leadingTrivia: Node | undefined,
    startOffset: number,
    prefixLength: number,
    isDigit: (character: string) => boolean,
    missingDigitDiagnostic: DiagnosticTemplate): LiteralNode {
    const reader = lexer.reader;
    reader.advance(prefixLength);

    const digitCount = this.readDigitsWithSeparators(lexer, isDigit);
    if (digitCount === 0) {
      const diagnosticSpan = reader.createSpan(reader.currentOffset, 0);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(missingDigitDiagnostic, diagnosticSpan);
    }

    const isBigInt = reader.peekCodeUnit() === Resources.bigIntSuffix;
    if (isBigInt)
      reader.advance();

    return this.createLiteral(lexer, leadingTrivia, startOffset, isBigInt);
  }

  private readDecimalLiteral(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number): LiteralNode {
    const reader = lexer.reader;
    let hasLeadingZero = false;

    if (reader.peekCodeUnit() === Resources.digitZero) {
      reader.advance();

      if (reader.peekCodeUnit() === Resources.numericSeparator) {
        const diagnosticSpan = reader.createSpan(reader.currentOffset, 1);
        lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS6188, diagnosticSpan);
        reader.seek(startOffset);
        this.readDigitsWithSeparators(lexer, String.isAsciiDigit);
      }
      else {
        const followingDigitStart = reader.currentOffset;
        let isLegacyOctal = true;

        while (!reader.isAtEnd) {
          const character = reader.peekCodeUnit();
          if (!String.isAsciiDigit(character))
            break;

          if (!String.isAsciiOctalDigit(character))
            isLegacyOctal = false;

          reader.advance();
        }

        if (reader.currentOffset > followingDigitStart) {
          if (isLegacyOctal)
            return this.createLegacyOctalLiteral(lexer, leadingTrivia, startOffset);

          hasLeadingZero = true;
        }
      }
    }
    else
      this.readDigitsWithSeparators(lexer, String.isAsciiDigit);

    const fixedPartEnd = reader.currentOffset;
    if (reader.peekCodeUnit() === Resources.dot) {
      reader.advance();
      this.readDigitsWithSeparators(lexer, String.isAsciiDigit);
    }

    const hasExponent = reader.peekCodeUnit() === Resources.exponentLowercase || reader.peekCodeUnit() === Resources.exponentUppercase;
    if (hasExponent) {
      reader.advance();
      if (reader.peekCodeUnit() === Resources.plus || reader.peekCodeUnit() === Resources.minus)
        reader.advance();

      if (this.readDigitsWithSeparators(lexer, String.isAsciiDigit) === 0) {
        const diagnosticSpan = reader.createSpan(reader.currentOffset, 0);
        lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1124, diagnosticSpan);
      }
    }

    if (hasLeadingZero) {
      const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1489, span);
      return this.createLiteral(lexer, leadingTrivia, startOffset, false);
    }

    const isBigInt = fixedPartEnd === reader.currentOffset && reader.peekCodeUnit() === Resources.bigIntSuffix;
    if (isBigInt)
      reader.advance();

    if (TypeScriptCharacterClassifier.isIdentifierStart(reader.peekCodePoint())) {
      const identifierOffset = reader.currentOffset;
      const identifier = this.identifierValueReader.read(reader);

      if (!isBigInt && identifier === Resources.bigIntSuffix) {
        if (hasExponent) {
          const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
          lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1352, span);
          return this.createLiteral(lexer, leadingTrivia, startOffset, false);
        }

        if (fixedPartEnd < identifierOffset) {
          const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
          lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1353, span);
          return this.createLiteral(lexer, leadingTrivia, startOffset, false);
        }
      }

      const diagnosticSpan = reader.createSpan(identifierOffset, reader.currentOffset - identifierOffset);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1351, diagnosticSpan);

      reader.seek(identifierOffset);
    }

    return this.createLiteral(lexer, leadingTrivia, startOffset, isBigInt);
  }

  private readDigitsWithSeparators(lexer: TypeScriptLexer, isDigit: (character: string) => boolean): number {
    const reader = lexer.reader;
    let isSeparatorAllowed = false;
    let digitCount = 0;
    let isPreviousCharacterSeparator = false;

    while (!reader.isAtEnd) {
      const character = reader.peekCodeUnit();
      if (isDigit(character)) {
        isSeparatorAllowed = true;
        digitCount++;
        isPreviousCharacterSeparator = false;
        reader.advance();
        continue;
      }

      if (character !== Resources.numericSeparator)
        break;

      if (isSeparatorAllowed) {
        isSeparatorAllowed = false;
        isPreviousCharacterSeparator = true;
      }
      else {
        const diagnosticSpan = reader.createSpan(reader.currentOffset, 1);
        const diagnosticTemplate = isPreviousCharacterSeparator
          ? TypeScriptDiagnosticTemplates.TS6189
          : TypeScriptDiagnosticTemplates.TS6188;
        lexer.diagnosticCollector.addTypeScriptParseDiagnostic(diagnosticTemplate, diagnosticSpan);
      }

      reader.advance();
    }

    if (isPreviousCharacterSeparator) {
      const diagnosticSpan = reader.createSpan(reader.currentOffset - 1, 1);
      lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS6188, diagnosticSpan);
    }

    return digitCount;
  }

  private createLegacyOctalLiteral(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number): TypeScriptNumericLiteralNode {
    const reader = lexer.reader;
    const value = reader.source.getText(startOffset, reader.currentOffset - startOffset);
    let firstSignificantDigit = 0;

    while (firstSignificantDigit < value.length && value.charAt(firstSignificantDigit) === Resources.digitZero)
      firstSignificantDigit++;

    const octalDigits = firstSignificantDigit === value.length
      ? Resources.digitZero
      : value.substring(firstSignificantDigit);
    const hasPrecedingMinus = lexer.precedingNode instanceof TypeScriptMinusNode;
    const suggestion = `${hasPrecedingMinus ? Resources.minus : String.empty}${Resources.octalPrefixLowercase}${octalDigits}`;
    const diagnosticStart = hasPrecedingMinus ? startOffset - 1 : startOffset;
    const diagnosticSpan = reader.createSpan(diagnosticStart, reader.currentOffset - diagnosticStart);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1121, diagnosticSpan, [suggestion]);

    return this.createLiteral(lexer, leadingTrivia, startOffset, false);
  }

  private createLiteral(lexer: TypeScriptLexer, leadingTrivia: Node | undefined, startOffset: number, isBigInt: boolean): LiteralNode {
    const reader = lexer.reader;
    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const value = reader.source.getText(span);

    return isBigInt
      ? new TypeScriptBigIntLiteralNode(value, span, leadingTrivia)
      : new TypeScriptNumericLiteralNode(value, span, leadingTrivia);
  }
}
