/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexBarNode } from "../../models/nodes/punctuators/regex-bar.node.js";
import { RegexCloseParenthesisNode } from "../../models/nodes/punctuators/regex-close-parenthesis.node.js";
import { RegexAlternativeNode } from "../../models/nodes/regex-alternative.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexAlternativeParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(stopsAtCloseParenthesis: boolean): RegexAlternativeNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const terms: Node[] = [];

    while (!this.regexParser.isEndOfFile &&
      !(this.regexParser.currentNode instanceof RegexBarNode) &&
      (!stopsAtCloseParenthesis || !(this.regexParser.currentNode instanceof RegexCloseParenthesisNode)))
      terms.push(...this.regexParser.parseTerm());

    const endOffset = this.regexParser.currentNode.span.startOffset;
    return new RegexAlternativeNode(terms, this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset));
  }
}
