/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCapturingGroupNode } from "../../models/nodes/groups/regex-capturing-group.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import type { RegexGroupEndParser } from "./regex-group-end.parser.js";

export class RegexCapturingGroupParser {
  private readonly groupEndParser: RegexGroupEndParser;
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser, groupEndParser: RegexGroupEndParser) {
    this.regexParser = regexParser;
    this.groupEndParser = groupEndParser;
  }

  public parse(startOffset: number): RegexCapturingGroupNode {
    const groupIndex = this.regexParser.context.claimCapturingGroupIndex();
    const disjunctionNode = this.regexParser.parseDisjunction(true);
    const endOffset = this.groupEndParser.parse();
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);

    return new RegexCapturingGroupNode(groupIndex, disjunctionNode, span);
  }
}
