/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexLookaheadAssertionNode } from "../../models/nodes/assertions/regex-lookahead-assertion.node.js";
import { RegexLookbehindAssertionNode } from "../../models/nodes/assertions/regex-lookbehind-assertion.node.js";
import { RegexExclamationNode } from "../../models/nodes/punctuators/regex-exclamation.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import type { RegexGroupEndParser } from "./regex-group-end.parser.js";

export class RegexLookaroundParser {
  private readonly groupEndParser: RegexGroupEndParser;
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser, groupEndParser: RegexGroupEndParser) {
    this.regexParser = regexParser;
    this.groupEndParser = groupEndParser;
  }

  public parseLookahead(startOffset: number): RegexLookaheadAssertionNode {
    const negated = this.regexParser.currentNode instanceof RegexExclamationNode;
    this.regexParser.advance();
    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexLookaheadAssertionNode(disjunctionNode, negated, span);
  }

  public parseLookbehind(startOffset: number): RegexLookbehindAssertionNode {
    const negated = this.regexParser.currentNode instanceof RegexExclamationNode;
    this.regexParser.advance();
    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexLookbehindAssertionNode(disjunctionNode, negated, span);
  }
}
