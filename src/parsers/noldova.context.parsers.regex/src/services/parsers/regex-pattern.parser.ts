/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexPatternNode } from "../../models/nodes/regex-pattern.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexPatternParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): RegexPatternNode {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    const disjunctionNode = this.regexParser.parseDisjunction(false);
    const endOffset = this.regexParser.currentNode.span.startOffset;
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);
    const value = this.regexParser.context.source.getText(span);

    return new RegexPatternNode(value, disjunctionNode, span);
  }
}
