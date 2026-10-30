/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../extensions/nodes/node.extensions.js";

import { type Node, Parser } from "@noldova/context.parsers";

import type { RegexCharacterClassNode } from "../models/nodes/classes/regex-character-class.node.js";
import type { RegexClassStringDisjunctionNode } from "../models/nodes/classes/regex-class-string-disjunction.node.js";
import type { RegexAlternativeNode } from "../models/nodes/regex-alternative.node.js";
import type { RegexDisjunctionNode } from "../models/nodes/regex-disjunction.node.js";
import { RegexNode } from "../models/nodes/regex.node.js";
import type { RegexQuantifierNode } from "../models/nodes/regex-quantifier.node.js";
import { RegexParserContext } from "../models/regex-parser-context.js";
import type { RegexLexer } from "./lexers/regex.lexer.js";
import { RegexAlternativeParser } from "./parsers/regex-alternative.parser.js";
import { RegexAssertionParser } from "./parsers/regex-assertion.parser.js";
import { RegexCharacterClassParser } from "./parsers/regex-character-class.parser.js";
import { RegexClassSetExpressionParser } from "./parsers/regex-class-set-expression.parser.js";
import { RegexClassStringDisjunctionParser } from "./parsers/regex-class-string-disjunction.parser.js";
import { RegexDisjunctionParser } from "./parsers/regex-disjunction.parser.js";
import { RegexGroupParser } from "./parsers/regex-group.parser.js";
import { RegexPatternParser } from "./parsers/regex-pattern.parser.js";
import { RegexQuantifierParser } from "./parsers/regex-quantifier.parser.js";
import { RegexTermParser } from "./parsers/regex-term.parser.js";
import { RegexFlagValidator } from "./validators/regex-flag.validator.js";

export class RegexSyntaxParser extends Parser<RegexNode, RegexParserContext> {
  private readonly alternativeParser: RegexAlternativeParser = new RegexAlternativeParser(this);
  private readonly assertionParser: RegexAssertionParser = new RegexAssertionParser(this);
  private readonly characterClassParser: RegexCharacterClassParser = new RegexCharacterClassParser(this);
  private readonly classSetExpressionParser: RegexClassSetExpressionParser = new RegexClassSetExpressionParser(this);
  private readonly classStringDisjunctionParser: RegexClassStringDisjunctionParser = new RegexClassStringDisjunctionParser(this);
  private readonly disjunctionParser: RegexDisjunctionParser = new RegexDisjunctionParser(this);
  private readonly flagValidator: RegexFlagValidator = new RegexFlagValidator();
  private readonly groupParser: RegexGroupParser = new RegexGroupParser(this);
  private readonly patternParser: RegexPatternParser = new RegexPatternParser(this);
  private readonly quantifierParser: RegexQuantifierParser = new RegexQuantifierParser(this);
  private readonly termParser: RegexTermParser = new RegexTermParser(this);

  public readonly regexLexer: RegexLexer;

  public constructor(context: RegexParserContext, lexer: RegexLexer) {
    super(context, lexer);
    this.regexLexer = lexer;
  }

  public parseAlternative(stopsAtCloseParenthesis: boolean): RegexAlternativeNode {
    return this.alternativeParser.parse(stopsAtCloseParenthesis);
  }

  public parseAssertion(): Node | undefined {
    return this.assertionParser.parse();
  }

  public parseCharacterClass(): RegexCharacterClassNode {
    return this.characterClassParser.parse();
  }

  public parseClassSetExpression(): Node {
    return this.classSetExpressionParser.parse();
  }

  public parseClassStringDisjunction(): RegexClassStringDisjunctionNode {
    return this.classStringDisjunctionParser.parse();
  }

  public parseDisjunction(stopsAtCloseParenthesis: boolean): RegexDisjunctionNode {
    return this.disjunctionParser.parse(stopsAtCloseParenthesis);
  }

  public parseGroup(): Node {
    return this.groupParser.parse();
  }

  public parseQuantifier(): RegexQuantifierNode | undefined {
    return this.quantifierParser.parse();
  }

  public parseTerm(): readonly Node[] {
    return this.termParser.parse();
  }

  protected override parseRootNode(): RegexNode {
    const patternNode = this.patternParser.parse();
    this.flagValidator.validate(this);

    return new RegexNode(
      this.context.source.getText(this.regexLexer.inputSpan),
      patternNode,
      this.regexLexer.flagsNode,
      this.regexLexer.inputSpan);
  }
}
