/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import "@noldova/context.text";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexOpenBraceNode } from "../../models/nodes/punctuators/regex-open-brace.node.js";
import { RegexQuestionNode } from "../../models/nodes/punctuators/regex-question.node.js";
import { RegexQuantifierNode } from "../../models/nodes/regex-quantifier.node.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexQuantifierParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): RegexQuantifierNode | undefined {
    const minimum = this.regexParser.currentNode.getRegexQuantifierMinimum();
    if (!Object.isUndefined(minimum))
      return this.parseSimple(minimum, this.regexParser.currentNode.getRegexQuantifierMaximum());

    return this.regexParser.currentNode instanceof RegexOpenBraceNode
      ? this.parseBraced()
      : undefined;
  }

  private parseBraced(): RegexQuantifierNode | undefined {
    const reader = this.regexParser.regexLexer.reader;
    const startOffset = this.regexParser.currentNode.span.startOffset;
    let offset = 0;

    let character = reader.peekCodeUnit(offset);
    while (String.isAsciiDigit(character)) {
      offset++;
      character = reader.peekCodeUnit(offset);
    }

    if (offset === 0)
      return undefined;

    const minimumStartOffset = startOffset + Resources.openBrace.length;
    const minimumText = this.regexParser.context.source.getText(minimumStartOffset, reader.currentOffset + offset - minimumStartOffset);
    let maximumText = minimumText;
    const separator = reader.peekCodeUnit(offset);

    if (separator === Resources.comma) {
      offset += Resources.comma.length;
      const maximumStartOffset = offset;
      character = reader.peekCodeUnit(offset);
      while (String.isAsciiDigit(character)) {
        offset++;
        character = reader.peekCodeUnit(offset);
      }

      maximumText = offset === maximumStartOffset
        ? String.empty
        : this.regexParser.context.source.getText(reader.currentOffset + maximumStartOffset, offset - maximumStartOffset);
    }

    if (reader.peekCodeUnit(offset) !== Resources.closeBrace)
      return undefined;

    const endOffset = reader.currentOffset + offset + Resources.closeBrace.length;
    while (this.regexParser.currentNode.span.endOffset < endOffset)
      this.regexParser.advance();
    this.regexParser.advance();

    const greedy = !(this.regexParser.currentNode instanceof RegexQuestionNode);
    if (!greedy)
      this.regexParser.advance();

    const finalEndOffset = this.regexParser.currentNode.span.startOffset;
    const span = reader.createSpan(startOffset, finalEndOffset - startOffset);
    const minimum = BigInt(minimumText);
    const maximum = maximumText.length === 0
      ? undefined
      : BigInt(maximumText);

    if (!Object.isUndefined(maximum) && minimum > maximum)
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1012, span);

    return new RegexQuantifierNode(this.regexParser.context.source.getText(span), minimum, maximum, greedy, span);
  }

  private parseSimple(minimum: bigint, maximum: bigint | undefined): RegexQuantifierNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    this.regexParser.advance();

    const greedy = !(this.regexParser.currentNode instanceof RegexQuestionNode);
    if (!greedy)
      this.regexParser.advance();

    const endOffset = this.regexParser.currentNode.span.startOffset;
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexQuantifierNode(this.regexParser.context.source.getText(span), minimum, maximum, greedy, span);
  }
}
