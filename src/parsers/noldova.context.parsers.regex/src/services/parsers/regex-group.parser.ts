/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { RegexDiagnosticTemplates } from "../../models/diagnostics/regex-diagnostic-templates.js";
import { RegexCloseParenthesisNode } from "../../models/nodes/punctuators/regex-close-parenthesis.node.js";
import { RegexColonNode } from "../../models/nodes/punctuators/regex-colon.node.js";
import { RegexEqualsNode } from "../../models/nodes/punctuators/regex-equals.node.js";
import { RegexExclamationNode } from "../../models/nodes/punctuators/regex-exclamation.node.js";
import { RegexHyphenNode } from "../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexLessThanNode } from "../../models/nodes/punctuators/regex-less-than.node.js";
import { RegexOpenParenthesisNode } from "../../models/nodes/punctuators/regex-open-parenthesis.node.js";
import { RegexQuestionNode } from "../../models/nodes/punctuators/regex-question.node.js";
import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";
import { RegexUnknownNode } from "../../models/nodes/regex-unknown.node.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";
import { RegexCapturingGroupParser } from "./regex-capturing-group.parser.js";
import { RegexGroupEndParser } from "./regex-group-end.parser.js";
import { RegexLookaroundParser } from "./regex-lookaround.parser.js";
import { RegexModifierGroupParser } from "./regex-modifier-group.parser.js";
import { RegexNamedCapturingGroupParser } from "./regex-named-capturing-group.parser.js";
import { RegexNonCapturingGroupParser } from "./regex-non-capturing-group.parser.js";

export class RegexGroupParser {
  private readonly capturingGroupParser: RegexCapturingGroupParser;
  private readonly lookaroundParser: RegexLookaroundParser;
  private readonly modifierGroupParser: RegexModifierGroupParser;
  private readonly namedCapturingGroupParser: RegexNamedCapturingGroupParser;
  private readonly nonCapturingGroupParser: RegexNonCapturingGroupParser;
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    const groupEndParser = new RegexGroupEndParser(regexParser);

    this.regexParser = regexParser;
    this.capturingGroupParser = new RegexCapturingGroupParser(regexParser, groupEndParser);
    this.lookaroundParser = new RegexLookaroundParser(regexParser, groupEndParser);
    this.modifierGroupParser = new RegexModifierGroupParser(regexParser, groupEndParser);
    this.namedCapturingGroupParser = new RegexNamedCapturingGroupParser(regexParser, groupEndParser);
    this.nonCapturingGroupParser = new RegexNonCapturingGroupParser(regexParser, groupEndParser);
  }

  public parse(): Node {
    const startOffset = this.regexParser.currentNode.span.startOffset;
    if (this.regexParser.context.nestingDepth >= Resources.maximumNestingDepth)
      return this.parseExcessivelyNestedGroup(startOffset);

    this.regexParser.context.nestingDepth++;
    this.regexParser.advance();

    try {
      const question = this.regexParser.currentNode;
      if (!(question instanceof RegexQuestionNode))
        return this.capturingGroupParser.parse(startOffset);

      this.regexParser.advance();
      const prefix = this.regexParser.currentNode;
      if (prefix instanceof RegexColonNode)
        return this.nonCapturingGroupParser.parse(startOffset);

      if (prefix instanceof RegexEqualsNode || prefix instanceof RegexExclamationNode)
        return this.lookaroundParser.parseLookahead(startOffset);

      if (prefix instanceof RegexLessThanNode)
        return this.parseLessThanGroup(startOffset);

      if (!(prefix instanceof RegexCharacterNode) && !(prefix instanceof RegexHyphenNode))
        this.regexParser.context.diagnosticCollector.add(RegexDiagnosticTemplates.CTX1005, prefix.span);

      return this.modifierGroupParser.parse(startOffset);
    }
    finally {
      this.regexParser.context.nestingDepth--;
    }
  }

  private parseExcessivelyNestedGroup(startOffset: number): RegexUnknownNode {
    this.regexParser.context.diagnosticCollector.add(
      RegexDiagnosticTemplates.CTX1037,
      this.regexParser.currentNode.span,
      [Resources.maximumNestingDepth]);

    let nestingDepth = 0;
    do {
      if (this.regexParser.currentNode instanceof RegexOpenParenthesisNode)
        nestingDepth++;
      else if (this.regexParser.currentNode instanceof RegexCloseParenthesisNode)
        nestingDepth--;

      this.regexParser.advance();
    }
    while (!this.regexParser.isEndOfFile && nestingDepth > 0);

    const endOffset = this.regexParser.currentNode.span.startOffset;
    const span = this.regexParser.regexLexer.reader.createSpan(startOffset, endOffset - startOffset);
    return new RegexUnknownNode(this.regexParser.context.source.getText(span), span);
  }

  private parseLessThanGroup(startOffset: number): Node {
    const followingCharacter = this.regexParser.regexLexer.reader.peekCodeUnit();
    if (followingCharacter === Resources.equals || followingCharacter === Resources.exclamation) {
      this.regexParser.advance();
      return this.lookaroundParser.parseLookbehind(startOffset);
    }

    return this.namedCapturingGroupParser.parse(startOffset);
  }
}
