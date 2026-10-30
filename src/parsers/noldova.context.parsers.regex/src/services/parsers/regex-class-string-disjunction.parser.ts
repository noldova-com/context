/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexClassStringDisjunctionNode } from "../../models/nodes/classes/regex-class-string-disjunction.node.js";
import { RegexClassStringNode } from "../../models/nodes/classes/regex-class-string.node.js";
import { RegexBarNode } from "../../models/nodes/punctuators/regex-bar.node.js";
import { RegexCloseBraceNode } from "../../models/nodes/punctuators/regex-close-brace.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import { RegexClassSetCharacterValidator } from "../validators/regex-class-set-character.validator.js";

export class RegexClassStringDisjunctionParser {
  private readonly classSetCharacterValidator: RegexClassSetCharacterValidator = new RegexClassSetCharacterValidator();
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): RegexClassStringDisjunctionNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    this.regexParser.advance();
    const strings: RegexClassStringNode[] = [];

    do {
      strings.push(this.parseString());
      const separator = this.regexParser.currentNode;
      if (!(separator instanceof RegexBarNode))
        break;

      this.regexParser.advance();
    }
    while (true);

    const closingBrace = this.regexParser.currentNode;
    let endOffset = closingBrace.span.startOffset;
    if (closingBrace instanceof RegexCloseBraceNode) {
      endOffset = closingBrace.span.endOffset;
      this.regexParser.advance();
    }
    else
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1031, closingBrace.span);

    return new RegexClassStringDisjunctionNode(strings, this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset));
  }

  private parseString(): RegexClassStringNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const characters: Node[] = [];

    while (!this.regexParser.isEndOfFile && !(this.regexParser.currentNode instanceof RegexBarNode) && !(this.regexParser.currentNode instanceof RegexCloseBraceNode)) {
      const character = this.regexParser.currentNode;
      if (Object.isUndefined(character.getRegexCharacterValue()))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1036, character.span);
      else
        this.classSetCharacterValidator.validate(this.regexParser, character);

      characters.push(character);
      this.regexParser.advance();
    }

    const endOffset = this.regexParser.currentNode.span.startOffset;
    return new RegexClassStringNode(characters, this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset));
  }
}
