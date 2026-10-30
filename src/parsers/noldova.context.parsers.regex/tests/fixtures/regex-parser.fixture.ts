/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type ParserResult, Source, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, type RegexNode, RegexParser } from "@noldova/context.parsers.regex";
import { RegexParserContext } from "@noldova/context.parsers.regex/models/regex-parser-context.js";
import { RegexLexer } from "@noldova/context.parsers.regex/services/lexers/regex.lexer.js";
import { RegexSyntaxParser } from "@noldova/context.parsers.regex/services/regex-syntax.parser.js";
import { Assert } from "@noldova/context.testing";

export class RegexParserFixture {
  public static createSyntaxParser(pattern: string, flagsValue: string = String.empty): RegexSyntaxParser {
    const source = new Source(pattern + flagsValue);
    const context = new RegexParserContext(source);
    const lexer = new RegexLexer(
      source,
      new SourceSpan(0, pattern.length),
      new SourceSpan(pattern.length, flagsValue.length),
      new SourceSpan(0, pattern.length + flagsValue.length),
      context.diagnosticCollector);

    return new RegexSyntaxParser(context, lexer);
  }

  public static parse(pattern: string, flagsValue: string = String.empty): ParserResult<RegexNode> {
    return new RegexParser(pattern, flagsValue).parse();
  }

  public static parseFirstAlternative(pattern: string, flagsValue: string = String.empty): RegexAlternativeNode {
    const alternative = RegexParserFixture.parse(pattern, flagsValue).rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    return alternative;
  }
}
