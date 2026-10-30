/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNonCapturingGroupNode } from "../../models/nodes/groups/regex-non-capturing-group.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import type { RegexGroupEndParser } from "./regex-group-end.parser.js";

export class RegexNonCapturingGroupParser {
  private readonly groupEndParser: RegexGroupEndParser;
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser, groupEndParser: RegexGroupEndParser) {
    this.regexParser = regexParser;
    this.groupEndParser = groupEndParser;
  }

  public parse(startOffset: number): RegexNonCapturingGroupNode {
    this.regexParser.advance();
    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexNonCapturingGroupNode(disjunctionNode, span);
  }
}
