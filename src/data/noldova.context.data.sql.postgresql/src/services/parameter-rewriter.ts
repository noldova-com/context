/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { TokenKind } from "../enums/token-kind.js";
import { Resources } from "../resources.js";

export class ParameterRewriter {
  private readonly text: string;
  private readonly output: string[] = [];
  private position: number = 0;
  private placeholders: number = 0;
  private previous: TokenKind = TokenKind.None;

  private constructor(text: string) {
    this.text = text;
  }

  public static rewrite(text: string, parameters: number): string {
    const rewriter = new ParameterRewriter(text);
    rewriter.scan();
    if (rewriter.placeholders !== parameters)
      throw new DataException(Resources.formatParameterCount(rewriter.placeholders, parameters));

    return rewriter.output.join("");
  }

  private scan(): void {
    while (this.position < this.text.length) {
      const start = this.position;
      const character = this.text.charAt(start);
      if (this.text.startsWith(Resources.lineCommentStart, start))
        this.skipLineComment();
      else if (this.text.startsWith(Resources.commentStart, start))
        this.skipBlockComment();
      else if (character === Resources.stringQuote)
        this.skipString(false);
      else if (character === Resources.identifierQuote)
        this.skipQuoted(Resources.identifierQuote);
      else if (character === Resources.dollarQuote && this.skipDollarString())
        this.previous = TokenKind.Operand;
      else if (character === Resources.parameterMarker)
        this.rewriteMarker();
      else if (ParameterRewriter.isWordCharacter(character))
        this.scanWord();
      else
        this.scanOther(character);
    }
  }

  private skipLineComment(): void {
    const end = this.text.indexOf(Resources.lineEnd, this.position);
    this.copyTo(end < 0 ? this.text.length : end);
  }

  private skipBlockComment(): void {
    let depth = 0;
    let index = this.position;
    while (index < this.text.length) {
      if (this.text.startsWith(Resources.commentStart, index)) {
        depth += 1;
        index += Resources.commentStart.length;
      }
      else if (this.text.startsWith(Resources.commentEnd, index)) {
        depth -= 1;
        index += Resources.commentEnd.length;
        if (depth === 0)
          break;
      }
      else
        index += 1;
    }

    this.copyTo(index);
  }

  private skipString(escapes: boolean): void {
    let index = this.position + 1;
    while (index < this.text.length) {
      const character = this.text.charAt(index);
      if (escapes && character === Resources.stringEscape)
        index += 2;
      else if (character === Resources.stringQuote && this.text.charAt(index + 1) === Resources.stringQuote)
        index += 2;
      else if (character === Resources.stringQuote)
        break;
      else
        index += 1;
    }

    this.copyTo(Math.min(index + 1, this.text.length));
    this.previous = TokenKind.Operand;
  }

  private skipQuoted(quote: string): void {
    let index = this.position + 1;
    while (index < this.text.length) {
      if (this.text.charAt(index) === quote && this.text.charAt(index + 1) === quote)
        index += 2;
      else if (this.text.charAt(index) === quote)
        break;
      else
        index += 1;
    }

    this.copyTo(Math.min(index + 1, this.text.length));
    this.previous = TokenKind.Operand;
  }

  private skipDollarString(): boolean {
    const tagEnd = this.text.indexOf(Resources.dollarQuote, this.position + 1);
    if (tagEnd < 0)
      return false;

    const tag = this.text.slice(this.position, tagEnd + 1);
    if (!ParameterRewriter.isDollarTag(tag.slice(1, -1)))
      return false;

    const end = this.text.indexOf(tag, tagEnd + 1);
    this.copyTo(end < 0 ? this.text.length : end + tag.length);
    return true;
  }

  private rewriteMarker(): void {
    const next = this.text.charAt(this.position + 1);
    const before = this.position > 0 ? this.text.charAt(this.position - 1) : "";
    const joined = next.length > 0 && Resources.operatorCharacters.includes(next) || before.length > 0 && Resources.questionMarkPrefixes.includes(before);
    if (joined || this.previous === TokenKind.Operand)
      throw new DataException(Resources.formatQuestionMarkOperator(this.position));

    this.placeholders += 1;
    this.output.push(Resources.parameterPrefix + this.placeholders.toString());
    this.position += 1;
    this.previous = TokenKind.Operand;
  }

  private scanWord(): void {
    let end = this.position;
    while (end < this.text.length && ParameterRewriter.isWordCharacter(this.text.charAt(end)))
      end += 1;
    const word = this.text.slice(this.position, end);
    if (word.toLowerCase() === Resources.escapeStringPrefix && this.text.charAt(end) === Resources.stringQuote) {
      this.copyTo(end);
      this.skipString(true);
      return;
    }

    this.copyTo(end);
    this.previous = Resources.parameterKeywords.has(word.toLowerCase()) ? TokenKind.Keyword : TokenKind.Operand;
  }

  private scanOther(character: string): void {
    this.copyTo(this.position + 1);
    if (character === Resources.closingParenthesis || character === Resources.closingBracket)
      this.previous = TokenKind.Operand;
    else if (character.trim().length > 0)
      this.previous = TokenKind.Other;
  }

  private copyTo(end: number): void {
    this.output.push(this.text.slice(this.position, end));
    this.position = end;
  }

  private static isWordCharacter(character: string): boolean {
    return /^[\p{L}\p{N}_$]$/u.test(character);
  }

  private static isDollarTag(tag: string): boolean {
    return /^(?:[\p{L}_][\p{L}\p{N}_]*)?$/u.test(tag);
  }
}
