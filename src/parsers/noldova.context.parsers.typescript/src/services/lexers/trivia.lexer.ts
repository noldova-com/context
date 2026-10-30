/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type Node, WhitespaceNode } from "@noldova/context.parsers";
import "@noldova/context.text";

import "../../extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBlockCommentNode } from "../../models/nodes/trivia/typescript-block-comment.node.js";
import { TypeScriptConflictMarkerNode } from "../../models/nodes/trivia/typescript-conflict-marker.node.js";
import { TypeScriptLineCommentNode } from "../../models/nodes/trivia/typescript-line-comment.node.js";
import { TypeScriptShebangNode } from "../../models/nodes/trivia/typescript-shebang.node.js";
import { TypeScriptTriviaNode } from "../../models/nodes/typescript-trivia.node.js";
import { Resources } from "../../resources.js";
import { TypeScriptCharacterClassifier } from "./typescript-character-classifier.js";
import type { TypeScriptLexer } from "./typescript.lexer.js";

export class TriviaLexer {
  public lex(lexer: TypeScriptLexer): Node | undefined {
    const reader = lexer.reader;
    let trivia: Node[] | undefined;

    while (!reader.isAtEnd) {
      const startOffset = reader.currentOffset;

      if (startOffset === 0 && reader.startsWith(Resources.shebang)) {
        const value = reader.readUntil(TypeScriptCharacterClassifier.isLineTerminator).toString();
        (trivia ??= []).push(new TypeScriptShebangNode(value, reader.createSpan(startOffset, value.length)));
        continue;
      }

      if (this.isConflictMarker(lexer)) {
        (trivia ??= []).push(this.readConflictMarker(lexer));
        continue;
      }

      if (TypeScriptCharacterClassifier.isWhitespace(reader.source.content.charAt(startOffset))) {
        const value = reader.readWhile(TypeScriptCharacterClassifier.isWhitespace).toString();
        (trivia ??= []).push(new WhitespaceNode(value, reader.createSpan(startOffset, value.length)));
        continue;
      }

      if (reader.startsWith(Resources.slashSlash)) {
        reader.advance(Resources.slashSlash.length);
        const value = reader.readUntil(TypeScriptCharacterClassifier.isLineTerminator).toString();
        const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
        (trivia ??= []).push(new TypeScriptLineCommentNode(value, span));
        if (TriviaLexer.isLineCommentDirective(value))
          lexer.commentDirectiveOffsets.push(startOffset);
        continue;
      }

      if (reader.startsWith(Resources.slashAsterisk)) {
        reader.advance(Resources.slashAsterisk.length);
        const bodyStartOffset = reader.currentOffset;
        while (!reader.isAtEnd && !reader.startsWith(Resources.asteriskSlash))
          reader.advance();

        const value = reader.source.getText(bodyStartOffset, reader.currentOffset - bodyStartOffset);
        if (reader.isAtEnd) {
          const diagnosticSpan = reader.createSpan(reader.currentOffset, 0);
          lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1010, diagnosticSpan);
        }
        else
          reader.advance(Resources.asteriskSlash.length);

        const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
        (trivia ??= []).push(new TypeScriptBlockCommentNode(value, span));
        const lastLineStart = TriviaLexer.lastLineStart(value);
        const lastLineOffset = lastLineStart === 0 ? startOffset : bodyStartOffset + lastLineStart;
        if (TriviaLexer.isBlockCommentDirective(reader.source.getText(lastLineOffset, reader.currentOffset - lastLineOffset)))
          lexer.commentDirectiveOffsets.push(lastLineOffset);
        continue;
      }

      break;
    }

    if (Object.isUndefined(trivia))
      return undefined;

    const first = trivia[0]!;
    if (trivia.length === 1)
      return first;

    const span = reader.createSpan(first.span.startOffset, reader.currentOffset - first.span.startOffset);
    return new TypeScriptTriviaNode(trivia, span);
  }

  private static isLineCommentDirective(text: string): boolean {
    let index = 0;
    while (index < text.length && text[index] === Resources.slash)
      index++;
    return TriviaLexer.startsWithDirective(text, TriviaLexer.skipBlanks(text, index));
  }

  private static isBlockCommentDirective(text: string): boolean {
    let index = TriviaLexer.skipBlanks(text, 0);
    while (index < text.length && (text[index] === Resources.slash || text[index] === Resources.asterisk))
      index++;
    return TriviaLexer.startsWithDirective(text, TriviaLexer.skipBlanks(text, index));
  }

  private static skipBlanks(text: string, index: number): number {
    let blankEnd = index;
    while (blankEnd < text.length && (text[blankEnd] === Resources.space || text[blankEnd] === Resources.tab))
      blankEnd++;
    return blankEnd;
  }

  private static startsWithDirective(text: string, index: number): boolean {
    return text.startsWith(Resources.expectErrorDirective, index) || text.startsWith(Resources.ignoreDirective, index);
  }

  private static lastLineStart(text: string): number {
    for (let index = text.length - 1; index >= 0; index--)
      if (TypeScriptCharacterClassifier.isLineTerminator(text[index]!))
        return index + 1;
    return 0;
  }

  private isConflictMarker(lexer: TypeScriptLexer): boolean {
    const reader = lexer.reader;
    const position = reader.currentOffset;
    if (position > 0 && !TypeScriptCharacterClassifier.isLineTerminator(reader.source.content.charAt(position - 1)))
      return false;

    if (position + Resources.conflictMarkerStart.length >= reader.endOffset)
      return false;

    if (reader.startsWith(Resources.conflictMarkerSeparator))
      return true;

    return reader.peekCodeUnit(Resources.conflictMarkerStart.length) === Resources.space
      && (reader.startsWith(Resources.conflictMarkerStart) || reader.startsWith(Resources.conflictMarkerAncestor)
        || reader.startsWith(Resources.conflictMarkerEnd));
  }

  private readConflictMarker(lexer: TypeScriptLexer): TypeScriptConflictMarkerNode {
    const reader = lexer.reader;
    const startOffset = reader.currentOffset;
    const isLineMarker = reader.startsWith(Resources.conflictMarkerStart) || reader.startsWith(Resources.conflictMarkerEnd);

    if (isLineMarker)
      reader.readUntil(TypeScriptCharacterClassifier.isLineTerminator);
    else {
      const markerCharacter = reader.peekCodeUnit();
      reader.advance(Resources.conflictMarkerAncestor.length);

      while (!reader.isAtEnd) {
        const currentCharacter = reader.peekCodeUnit();
        const isFollowingMarker = currentCharacter !== markerCharacter
          && (currentCharacter === Resources.equals || currentCharacter === Resources.greaterThan)
          && this.isConflictMarker(lexer);
        if (isFollowingMarker)
          break;

        reader.advance();
      }
    }

    const span = reader.createSpan(startOffset, reader.currentOffset - startOffset);
    const diagnosticSpan = reader.createSpan(startOffset, Resources.conflictMarkerStart.length);
    lexer.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1185, diagnosticSpan);

    return new TypeScriptConflictMarkerNode(reader.source.getText(span), span);
  }
}
