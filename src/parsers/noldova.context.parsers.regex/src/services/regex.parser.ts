/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ParserResult, Source, type SourceReader, SourceSpan } from "@noldova/context.parsers";

import type { RegexNode } from "../models/nodes/regex.node.js";
import { RegexParserContext } from "../models/regex-parser-context.js";
import { RegexLexer } from "./lexers/regex.lexer.js";
import { RegexSyntaxParser } from "./regex-syntax.parser.js";

export class RegexParser {
  private readonly syntaxParser: RegexSyntaxParser;

  public constructor(pattern: string, flags?: string);
  public constructor(source: Source, patternSpan: SourceSpan, flagsSpan: SourceSpan, inputSpan: SourceSpan);
  public constructor(reader: SourceReader, flagsSpan: SourceSpan, inputSpan: SourceSpan);
  public constructor(...constructorArguments:
    [pattern: string, flags?: string | undefined] |
    [source: Source, patternSpan: SourceSpan, flagsSpan: SourceSpan, inputSpan: SourceSpan] |
    [reader: SourceReader, flagsSpan: SourceSpan, inputSpan: SourceSpan]) {
    let context: RegexParserContext;
    let lexer: RegexLexer;

    if (constructorArguments.length === 4) {
      const [source, patternSpan, flagsSpan, inputSpan] = constructorArguments;
      context = new RegexParserContext(source);
      lexer = new RegexLexer(source, patternSpan, flagsSpan, inputSpan, context.diagnosticCollector);
    }
    else if (constructorArguments.length === 3) {
      const [reader, flagsSpan, inputSpan] = constructorArguments;
      context = new RegexParserContext(reader.source);
      lexer = new RegexLexer(reader, flagsSpan, inputSpan, context.diagnosticCollector);
    }
    else {
      const [pattern, flags = String.empty] = constructorArguments;
      const source = new Source(pattern + flags);
      context = new RegexParserContext(source);
      lexer = new RegexLexer(source, new SourceSpan(0, pattern.length), new SourceSpan(pattern.length, flags.length), new SourceSpan(0, source.length), context.diagnosticCollector);
    }

    this.syntaxParser = new RegexSyntaxParser(context, lexer);
  }

  public parse(): ParserResult<RegexNode> {
    return this.syntaxParser.parse();
  }
}
