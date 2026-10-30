/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexCharacterClassNode } from "../../models/nodes/classes/regex-character-class.node.js";
import { RegexCharacterRangeNode } from "../../models/nodes/classes/regex-character-range.node.js";
import { RegexClassUnionNode } from "../../models/nodes/classes/regex-class-union.node.js";
import { RegexCloseBracketNode } from "../../models/nodes/punctuators/regex-close-bracket.node.js";
import { RegexHyphenNode } from "../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexOpenBracketNode } from "../../models/nodes/punctuators/regex-open-bracket.node.js";
import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import { RegexCharacterRangeValidator } from "../validators/regex-character-range.validator.js";

export class RegexCharacterClassParser {
  private readonly characterRangeValidator: RegexCharacterRangeValidator = new RegexCharacterRangeValidator();
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): RegexCharacterClassNode {
    if (this.regexParser.context.nestingDepth >= Resources.maximumNestingDepth)
      return this.parseExcessivelyNestedClass();

    this.regexParser.context.nestingDepth++;
    try {
      return this.parseClass();
    }
    finally {
      this.regexParser.context.nestingDepth--;
    }
  }

  private parseClass(): RegexCharacterClassNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    this.regexParser.advance();

    const firstNode = this.regexParser.currentNode;
    const negated = firstNode instanceof RegexCharacterNode && firstNode.value === Resources.caret;
    if (negated)
      this.regexParser.advance();

    const expressionNode = this.regexParser.regexLexer.unicodeSetsMode
      ? this.regexParser.parseClassSetExpression()
      : this.parseClassicExpression();
    const mayContainStrings = this.regexParser.regexLexer.unicodeSetsMode && expressionNode.mayContainRegexStrings();
    const endOffset = this.completeClass();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    if (negated && mayContainStrings)
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1030, span);

    return new RegexCharacterClassNode(expressionNode, negated, mayContainStrings, span);
  }

  private parseExcessivelyNestedClass(): RegexCharacterClassNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    this.regexParser.context.diagnosticCollector.add(
      RegexDiagnosticTemplates.CTX1037,
      this.regexParser.currentNode.span,
      [Resources.maximumNestingDepth]);

    let nestingDepth = 0;
    do {
      if (this.regexParser.currentNode instanceof RegexOpenBracketNode)
        nestingDepth++;
      else if (this.regexParser.currentNode instanceof RegexCloseBracketNode)
        nestingDepth--;

      this.regexParser.advance();
    }
    while (!this.regexParser.isEndOfFile && nestingDepth > 0);

    const endOffset = this.regexParser.currentNode.span.startOffset;
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);
    const unknownNode = new RegexUnknownNode(this.regexParser.context.source.getText(span), span);
    return new RegexCharacterClassNode(unknownNode, false, false, span);
  }

  private completeClass(): number {
    if (!(this.regexParser.currentNode instanceof RegexCloseBracketNode)) {
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1004, this.regexParser.currentNode.span);
      return this.regexParser.currentNode.span.startOffset;
    }

    const endOffset = this.regexParser.currentNode.span.endOffset;
    this.regexParser.advance();

    return endOffset;
  }

  private parseClassicExpression(): RegexClassUnionNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const operands: Node[] = [];

    while (!this.regexParser.isEndOfFile && !(this.regexParser.currentNode instanceof RegexCloseBracketNode)) {
      const startNode = this.consumeClassAtom();
      if (!(this.regexParser.currentNode instanceof RegexHyphenNode)) {
        operands.push(startNode);
        continue;
      }

      const hyphen = this.regexParser.currentNode;
      this.regexParser.advance();
      if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode) {
        operands.push(startNode, hyphen);
        continue;
      }

      const endNode = this.consumeClassAtom();
      const span = this.regexParser.regexLexer.reader.createSpan(startNode.span, endNode.span);
      this.characterRangeValidator.validate(this.regexParser, startNode, endNode, span);
      operands.push(new RegexCharacterRangeNode(startNode, endNode, span));
    }

    const endOffset = this.regexParser.currentNode.span.startOffset;
    return new RegexClassUnionNode(operands, this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset));
  }

  private consumeClassAtom(): Node {
    const node = this.regexParser.currentNode;
    this.regexParser.advance();
    return node;
  }
}
