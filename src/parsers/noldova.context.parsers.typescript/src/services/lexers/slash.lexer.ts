/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";
import { RegexNode, RegexParser } from "@noldova/context.parsers.regex";
import "@noldova/context.text";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptSlashEqualsNode } from "../../models/nodes/operators/typescript-slash-equals.node.js";
import { TypeScriptSlashNode } from "../../models/nodes/operators/typescript-slash.node.js";
import { Resources } from "../../resources.js";
import { TypeScriptCharacterClassifier } from "./typescript-character-classifier.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class SlashLexer {
  public lex(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): ValueNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance(Resources.slash.length);

    if (reader.startsWith(Resources.equals)) {
      reader.advance(Resources.equals.length);
      return new TypeScriptSlashEqualsNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
    }

    return new TypeScriptSlashNode(reader.createSpan(startOffset, reader.currentOffset - startOffset), leadingTrivia);
  }

  public reLexRegularExpression(lexer: TypeScriptLexer, leadingTrivia: Node | undefined): RegexNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    reader.advance(Resources.slash.length);
    const patternStartOffset = reader.currentOffset;

    let isEscaped = false;
    let isInCharacterClass = false;

    while (!reader.isAtEnd) {
      const character = reader.peekCodeUnit();
      if (TypeScriptCharacterClassifier.isLineTerminator(character))
        return this.createUnterminatedRegularExpression(lexer, leadingTrivia, startOffset, patternStartOffset);

      if (isEscaped) {
        isEscaped = false;
        reader.readCodePoint();
        continue;
      }

      if (character === Resources.slash && !isInCharacterClass) {
        const patternEndOffset = reader.currentOffset;
        reader.advance(Resources.slash.length);
        const flagsStartOffset = reader.currentOffset;
        this.readFlags(lexer);
        return this.createRegularExpression(lexer, leadingTrivia, startOffset, patternStartOffset, patternEndOffset, flagsStartOffset);
      }

      if (character === Resources.openBracket)
        isInCharacterClass = true;
      else if (character === Resources.backslash)
        isEscaped = true;
      else if (character === Resources.closeBracket)
        isInCharacterClass = false;

      reader.readCodePoint();
    }

    return this.createUnterminatedRegularExpression(lexer, leadingTrivia, startOffset, patternStartOffset);
  }

  private readFlags(lexer: TypeScriptLexer): void {
    const reader = lexer.reader;

    while (!reader.isAtEnd) {
      if (!TypeScriptCharacterClassifier.isIdentifierPart(reader.peekCodePoint()))
        break;

      reader.readCodePoint();
    }
  }

  private createUnterminatedRegularExpression(
    lexer: TypeScriptLexer,
    leadingTrivia: Node | undefined,
    startOffset: number,
    patternStartOffset: number): RegexNode {
    const endOffset = this.recoverUnterminatedEnd(lexer, patternStartOffset, lexer.reader.currentOffset);
    const span = lexer.reader.createSpan(startOffset, endOffset - startOffset);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1161, span);
    return this.createRegularExpression(lexer, leadingTrivia, startOffset, patternStartOffset, endOffset, endOffset);
  }

  private recoverUnterminatedEnd(lexer: TypeScriptLexer, bodyStartOffset: number, bodyEndOffset: number): number {
    const reader = lexer.reader;
    reader.seek(bodyStartOffset);

    let characterClassDepth = 0;
    let groupDepth = 0;
    let isEscaped = false;
    let isInDecimalQuantifier = false;

    while (reader.currentOffset < bodyEndOffset) {
      const character = reader.source.content.charAt(reader.currentOffset);

      if (isEscaped)
        isEscaped = false;
      else if (character === Resources.backslash)
        isEscaped = true;
      else if (character === Resources.openBracket)
        characterClassDepth++;
      else if (character === Resources.closeBracket && characterClassDepth !== 0)
        characterClassDepth--;
      else if (characterClassDepth === 0)
        if (character === Resources.openBrace)
          isInDecimalQuantifier = true;
        else if (character === Resources.closeBrace && isInDecimalQuantifier)
          isInDecimalQuantifier = false;
        else if (!isInDecimalQuantifier)
          if (character === Resources.openParenthesis)
            groupDepth++;
          else if (character === Resources.closeParenthesis && groupDepth !== 0)
            groupDepth--;
          else if (character === Resources.closeParenthesis || character === Resources.closeBracket || character === Resources.closeBrace)
            break;

      reader.readCodePoint();
    }

    let endOffset = reader.currentOffset;
    while (endOffset > bodyStartOffset) {
      const character = reader.source.content.charAt(endOffset - 1);
      if (!TypeScriptCharacterClassifier.isWhitespace(character) && character !== Resources.semicolon)
        break;

      endOffset--;
    }

    reader.seek(endOffset);
    return endOffset;
  }

  private createRegularExpression(
    lexer: TypeScriptLexer,
    leadingTrivia: Node | undefined,
    startOffset: number,
    patternStartOffset: number,
    patternEndOffset: number,
    flagsStartOffset: number): RegexNode {
    const reader = lexer.reader;
    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const result = new RegexParser(
      reader.source,
      reader.createSpan(patternStartOffset, patternEndOffset - patternStartOffset),
      reader.createSpan(flagsStartOffset, reader.currentOffset - flagsStartOffset),
      span).parse();

    for (const diagnostic of result.diagnostics)
      lexer.diagnosticCollector.add(diagnostic);

    return new RegexNode(result.rootNode.rawValue, result.rootNode.patternNode, result.rootNode.flagsNode, result.rootNode.span, leadingTrivia);
  }
}
