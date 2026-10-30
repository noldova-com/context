/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Node } from "@noldova/context.parsers";

import { RegexOpenParenthesisNode } from "../../models/nodes/punctuators/regex-open-parenthesis.node.js";
import { Resources } from "../../resources.js";
import type { RegexSyntaxParser } from "../regex-syntax.parser.js";

export class RegexAssertionParser {
  private readonly regexParser: RegexSyntaxParser;

  public constructor(regexParser: RegexSyntaxParser) {
    this.regexParser = regexParser;
  }

  public parse(): Node | undefined {
    const assertionNode = this.regexParser.currentNode;
    if (assertionNode.isSimpleRegexAssertion()) {
      this.regexParser.advance();
      return assertionNode;
    }

    if (!(this.regexParser.currentNode instanceof RegexOpenParenthesisNode))
      return undefined;

    const reader = this.regexParser.regexLexer.reader;
    if (reader.peekCodeUnit() !== Resources.question)
      return undefined;

    const prefixCharacter = reader.peekCodeUnit(Resources.question.length);
    if (prefixCharacter === Resources.equals || prefixCharacter === Resources.exclamation)
      return this.regexParser.parseGroup();

    if (prefixCharacter !== Resources.lessThan)
      return undefined;

    const lookbehindCharacter = reader.peekCodeUnit(Resources.question.length + Resources.lessThan.length);
    return lookbehindCharacter === Resources.equals || lookbehindCharacter === Resources.exclamation
      ? this.regexParser.parseGroup()
      : undefined;
  }
}
