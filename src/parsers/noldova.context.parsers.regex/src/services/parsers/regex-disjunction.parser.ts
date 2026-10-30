/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexBarNode } from "../../models/nodes/punctuators/regex-bar.node.js";
import type { RegexAlternativeNode } from "../../models/nodes/regex-alternative.node.js";
import { RegexDisjunctionNode } from "../../models/nodes/regex-disjunction.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexDisjunctionParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(stopsAtCloseParenthesis: boolean): RegexDisjunctionNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const alternatives: RegexAlternativeNode[] = [];
    const disjunctionIndex = this.regexParser.context.beginDisjunction();
    let alternativeIndex = 0;

    while (true) {
      this.regexParser.context.enterAlternative(disjunctionIndex, alternativeIndex);
      alternatives.push(this.regexParser.parseAlternative(stopsAtCloseParenthesis));
      this.regexParser.context.leaveAlternative();

      if (!(this.regexParser.currentNode instanceof RegexBarNode))
        break;

      this.regexParser.advance();
      alternativeIndex++;
    }

    const endOffset = this.regexParser.currentNode.span.startOffset;
    return new RegexDisjunctionNode(alternatives, this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset));
  }
}
