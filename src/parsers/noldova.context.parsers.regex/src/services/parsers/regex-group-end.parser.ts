/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexCloseParenthesisNode } from "../../models/nodes/punctuators/regex-close-parenthesis.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexGroupEndParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): number {
    if (!(this.regexParser.currentNode instanceof RegexCloseParenthesisNode)) {
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1003, this.regexParser.currentNode.span);
      return this.regexParser.currentNode.span.startOffset;
    }

    const endOffset = this.regexParser.currentNode.span.endOffset;
    this.regexParser.advance();
    return endOffset;
  }
}
