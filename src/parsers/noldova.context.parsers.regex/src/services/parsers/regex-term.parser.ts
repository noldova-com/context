/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexLookaheadAssertionNode } from "../../models/nodes/assertions/regex-lookahead-assertion.node.js";
import { RegexCloseBraceNode } from "../../models/nodes/punctuators/regex-close-brace.node.js";
import { RegexCloseBracketNode } from "../../models/nodes/punctuators/regex-close-bracket.node.js";
import { RegexCloseParenthesisNode } from "../../models/nodes/punctuators/regex-close-parenthesis.node.js";
import { RegexOpenBraceNode } from "../../models/nodes/punctuators/regex-open-brace.node.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexTermParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): readonly Node[] {
    const assertion = this.regexParser.parseAssertion();
    if (!Object.isUndefined(assertion)) {
      if (!this.regexParser.regexLexer.unicodeMode && assertion instanceof RegexLookaheadAssertionNode) {
        const quantifier = this.regexParser.parseQuantifier();
        if (!Object.isUndefined(quantifier))
          return [assertion, quantifier];
      }

      return [assertion];
    }

    const misplacedQuantifier = this.regexParser.parseQuantifier();
    if (!Object.isUndefined(misplacedQuantifier)) {
      this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1013, misplacedQuantifier.span);
      return [misplacedQuantifier];
    }

    const atom = this.regexParser.currentNode.parseRegexAtom(this.regexParser);

    if (Object.isUndefined(atom)) {
      const unrecognizedTerm = this.regexParser.currentNode;
      if (unrecognizedTerm instanceof RegexCloseParenthesisNode
        || this.regexParser.regexLexer.unicodeMode && (unrecognizedTerm instanceof RegexCloseBracketNode || unrecognizedTerm instanceof RegexCloseBraceNode))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1033, unrecognizedTerm.span);
      else if (this.regexParser.regexLexer.unicodeMode && unrecognizedTerm instanceof RegexOpenBraceNode)
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1011, unrecognizedTerm.span);

      this.regexParser.advance();
      return [unrecognizedTerm];
    }

    const quantifier = this.regexParser.parseQuantifier();
    return Object.isUndefined(quantifier) ? [atom] : [atom, quantifier];
  }
}
