/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexCharacterRangeNode } from "../../models/nodes/classes/regex-character-range.node.js";
import { RegexClassUnionNode } from "../../models/nodes/classes/regex-class-union.node.js";
import { RegexClassStringDisjunctionStartNode } from "../../models/nodes/punctuators/regex-class-string-disjunction-start.node.js";
import { RegexCloseBracketNode } from "../../models/nodes/punctuators/regex-close-bracket.node.js";
import { RegexHyphenNode } from "../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexOpenBracketNode } from "../../models/nodes/punctuators/regex-open-bracket.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import { RegexCharacterRangeValidator } from "../validators/regex-character-range.validator.js";
import { RegexClassSetCharacterValidator } from "../validators/regex-class-set-character.validator.js";

export class RegexClassSetExpressionParser {
  private readonly characterRangeValidator: RegexCharacterRangeValidator = new RegexCharacterRangeValidator();
  private readonly classSetCharacterValidator: RegexClassSetCharacterValidator = new RegexClassSetCharacterValidator();
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): Node {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const operands: Node[] = [];

    if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode)
      return this.createUnion(operands, startOffset);

    if (this.regexParser.currentNode.isRegexClassSetOperator()) {
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1028, this.regexParser.currentNode.span);
      this.regexParser.advance();
      if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode)
        return this.createUnion(operands, startOffset);
    }

    operands.push(this.parseOperand());

    if (this.regexParser.currentNode.isRegexClassSetOperator())
      return this.parseOperatorExpression(operands, startOffset, this.regexParser.currentNode);

    while (!this.regexParser.isEndOfFile && !(this.regexParser.currentNode instanceof RegexCloseBracketNode)) {
      if (this.regexParser.currentNode.isRegexClassSetOperator()) {
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1027, this.regexParser.currentNode.span);
        this.regexParser.advance();
        if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode) {
          this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1028, this.regexParser.currentNode.span);
          break;
        }
      }

      operands.push(this.parseOperand());
    }

    return this.createUnion(operands, startOffset);
  }

  private createSpan(startOffset: number): SourceSpan {
    const endOffset = this.regexParser.currentNode.span.startOffset;
    return this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);
  }

  private parseOperand(): Node {
    let operand: Node;
    if (this.regexParser.currentNode instanceof RegexOpenBracketNode)
      operand = this.regexParser.parseCharacterClass();
    else if (this.regexParser.currentNode instanceof RegexClassStringDisjunctionStartNode)
      operand = this.regexParser.parseClassStringDisjunction();
    else {
      operand = this.regexParser.currentNode;
      this.classSetCharacterValidator.validate(this.regexParser, operand);
      this.regexParser.advance();
    }

    if (!(this.regexParser.currentNode instanceof RegexHyphenNode))
      return operand;

    this.regexParser.advance();
    return this.completeRange(operand);
  }

  private completeRange(operand: Node): Node {
    if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode || this.regexParser.currentNode.isRegexClassSetOperator()) {
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1028, this.regexParser.currentNode.span);
      return operand;
    }

    const endNode = this.regexParser.currentNode;
    this.classSetCharacterValidator.validate(this.regexParser, endNode);
    this.regexParser.advance();
    const span = this.regexParser.regexLexer.reader.createSpan(operand.span, endNode.span);
    this.characterRangeValidator.validate(this.regexParser, operand, endNode, span);

    return new RegexCharacterRangeNode(operand, endNode, span);
  }

  private createUnion(operands: readonly Node[], startOffset: number): RegexClassUnionNode {
    return new RegexClassUnionNode(operands, this.createSpan(startOffset));
  }

  private parseOperatorExpression(
    operands: Node[],
    startOffset: number,
    operatorNode: Node): Node {
    for (const operand of operands)
      this.validateOperatorOperand(operand);

    while (!this.regexParser.isEndOfFile && !(this.regexParser.currentNode instanceof RegexCloseBracketNode)) {
      const operator = this.regexParser.currentNode;
      const expectedOperator = operator.constructor === operatorNode.constructor;

      if (!expectedOperator)
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1027, operator.span);

      if (operator.isRegexClassSetOperator())
        this.regexParser.advance();
      else
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1028, operator.span);

      if (this.regexParser.isEndOfFile || this.regexParser.currentNode instanceof RegexCloseBracketNode) {
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1028, this.regexParser.currentNode.span);
        break;
      }

      const operand = this.parseOperand();
      this.validateOperatorOperand(operand);
      operands.push(operand);
    }

    return operatorNode.createRegexClassSetExpression(operands, this.createSpan(startOffset));
  }

  private validateOperatorOperand(node: Node): void {
    if (node instanceof RegexCharacterRangeNode)
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1038, node.span);
  }
}
