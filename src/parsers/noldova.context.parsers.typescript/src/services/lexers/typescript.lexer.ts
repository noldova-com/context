/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type DiagnosticCollector, EndOfFileNode, Lexer, type Node, type Source, type SourceReader, type ValueNode, type ValueNodeType } from "@noldova/context.parsers";
import "@noldova/context.text";

import { TypeScriptAtNode } from "../../models/nodes/delimiters/typescript-at.node.js";
import { TypeScriptCloseBraceNode } from "../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseBracketNode } from "../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptCloseParenthesisNode } from "../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptAsteriskNode } from "../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptQuestionNode } from "../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptTildeNode } from "../../models/nodes/operators/typescript-tilde.node.js";
import { Resources } from "../../resources.js";
import { AmpersandLexer } from "./ampersand.lexer.js";
import { AsteriskLexer } from "./asterisk.lexer.js";
import { BarLexer } from "./bar.lexer.js";
import { CaretLexer } from "./caret.lexer.js";
import { DotLexer } from "./dot.lexer.js";
import { EqualsLexer } from "./equals.lexer.js";
import { ExclamationLexer } from "./exclamation.lexer.js";
import { GreaterThanLexer } from "./greater-than.lexer.js";
import { IdentifierLexer } from "./identifier.lexer.js";
import { InvalidCharacterLexer } from "./invalid-character.lexer.js";
import { LessThanLexer } from "./less-than.lexer.js";
import { MinusLexer } from "./minus.lexer.js";
import { NumericLexer } from "./numeric.lexer.js";
import { PercentLexer } from "./percent.lexer.js";
import { PlusLexer } from "./plus.lexer.js";
import { PrivateIdentifierLexer } from "./private-identifier.lexer.js";
import { QuestionLexer } from "./question.lexer.js";
import { SlashLexer } from "./slash.lexer.js";
import { StringLexer } from "./string.lexer.js";
import { TemplateLiteralLexer } from "./template-literal.lexer.js";
import { TriviaLexer } from "./trivia.lexer.js";

export class TypeScriptLexer extends Lexer {
  public readonly commentDirectiveOffsets: number[];
  public precedingNode: Node | undefined = undefined;
  private readonly ampersandLexer: AmpersandLexer = new AmpersandLexer();
  private readonly asteriskLexer: AsteriskLexer = new AsteriskLexer();
  private readonly barLexer: BarLexer = new BarLexer();
  private readonly caretLexer: CaretLexer = new CaretLexer();
  private readonly dotLexer: DotLexer = new DotLexer();
  private readonly equalsLexer: EqualsLexer = new EqualsLexer();
  private readonly exclamationLexer: ExclamationLexer = new ExclamationLexer();
  private readonly greaterThanLexer: GreaterThanLexer = new GreaterThanLexer();
  private readonly identifierLexer: IdentifierLexer = new IdentifierLexer();
  private readonly invalidCharacterLexer: InvalidCharacterLexer = new InvalidCharacterLexer();
  private readonly lessThanLexer: LessThanLexer = new LessThanLexer();
  private readonly minusLexer: MinusLexer = new MinusLexer();
  private readonly numericLexer: NumericLexer = new NumericLexer();
  private readonly percentLexer: PercentLexer = new PercentLexer();
  private readonly plusLexer: PlusLexer = new PlusLexer();
  private readonly privateIdentifierLexer: PrivateIdentifierLexer = new PrivateIdentifierLexer();
  private readonly questionLexer: QuestionLexer = new QuestionLexer();
  private readonly slashLexer: SlashLexer = new SlashLexer();
  private readonly stringLexer: StringLexer = new StringLexer();
  private readonly templateLiteralLexer: TemplateLiteralLexer = new TemplateLiteralLexer();
  private readonly triviaLexer: TriviaLexer = new TriviaLexer();

  public constructor(sourceOrReader: Source | SourceReader, diagnosticCollector: DiagnosticCollector, commentDirectiveOffsets: number[]) {
    super(sourceOrReader, diagnosticCollector);
    this.commentDirectiveOffsets = commentDirectiveOffsets;
  }

  protected override lexNode(): Node {
    const leadingTrivia = this.triviaLexer.lex(this);
    const reader = this.reader;
    if (reader.isAtEnd)
      return new EndOfFileNode(reader.createSpan(reader.currentOffset, 0), leadingTrivia);

    const character = reader.source.content.charAt(reader.currentOffset);
    if (String.isAsciiDigit(character))
      return this.numericLexer.lex(this, leadingTrivia);

    switch (character) {
      case Resources.ampersand:
        return this.ampersandLexer.lex(this, leadingTrivia);
      case Resources.asterisk:
        return this.asteriskLexer.lex(this, leadingTrivia);
      case Resources.at:
        return this.lexPunctuator(leadingTrivia, TypeScriptAtNode);
      case Resources.backtick:
        return this.templateLiteralLexer.lex(this, leadingTrivia);
      case Resources.bar:
        return this.barLexer.lex(this, leadingTrivia);
      case Resources.caret:
        return this.caretLexer.lex(this, leadingTrivia);
      case Resources.closeBrace:
        return this.lexPunctuator(leadingTrivia, TypeScriptCloseBraceNode);
      case Resources.closeBracket:
        return this.lexPunctuator(leadingTrivia, TypeScriptCloseBracketNode);
      case Resources.closeParenthesis:
        return this.lexPunctuator(leadingTrivia, TypeScriptCloseParenthesisNode);
      case Resources.colon:
        return this.lexPunctuator(leadingTrivia, TypeScriptColonNode);
      case Resources.comma:
        return this.lexPunctuator(leadingTrivia, TypeScriptCommaNode);
      case Resources.dot:
        if (String.isAsciiDigit(reader.peekCodeUnit(1)))
          return this.numericLexer.lex(this, leadingTrivia);

        return this.dotLexer.lex(this, leadingTrivia);
      case Resources.doubleQuote:
      case Resources.singleQuote:
        return this.stringLexer.lex(this, leadingTrivia);
      case Resources.equals:
        return this.equalsLexer.lex(this, leadingTrivia);
      case Resources.exclamation:
        return this.exclamationLexer.lex(this, leadingTrivia);
      case Resources.greaterThan:
        return this.greaterThanLexer.lex(this, leadingTrivia);
      case Resources.hash:
        return this.privateIdentifierLexer.lex(this, leadingTrivia);
      case Resources.lessThan:
        return this.lessThanLexer.lex(this, leadingTrivia);
      case Resources.minus:
        return this.minusLexer.lex(this, leadingTrivia);
      case Resources.openBrace:
        return this.lexPunctuator(leadingTrivia, TypeScriptOpenBraceNode);
      case Resources.openBracket:
        return this.lexPunctuator(leadingTrivia, TypeScriptOpenBracketNode);
      case Resources.openParenthesis:
        return this.lexPunctuator(leadingTrivia, TypeScriptOpenParenthesisNode);
      case Resources.percent:
        return this.percentLexer.lex(this, leadingTrivia);
      case Resources.plus:
        return this.plusLexer.lex(this, leadingTrivia);
      case Resources.question:
        return this.questionLexer.lex(this, leadingTrivia);
      case Resources.semicolon:
        return this.lexPunctuator(leadingTrivia, TypeScriptSemicolonNode);
      case Resources.slash:
        return this.slashLexer.lex(this, leadingTrivia);
      case Resources.tilde:
        return this.lexPunctuator(leadingTrivia, TypeScriptTildeNode);
    }

    const identifier = this.identifierLexer.lex(this, leadingTrivia);
    if (!Object.isUndefined(identifier))
      return identifier;

    return this.invalidCharacterLexer.lex(this, leadingTrivia);
  }

  public reLexLessThan(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.lessThanLexer.reLex(this, leadingTrivia));
  }

  public reLexGreaterThan(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.greaterThanLexer.reLex(this, leadingTrivia));
  }

  public reLexRegularExpression(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.slashLexer.reLexRegularExpression(this, leadingTrivia));
  }

  public reLexTemplateContinuation(leadingTrivia: Node | undefined, isTaggedTemplate: boolean): Node {
    return this.lexWith(() => this.templateLiteralLexer.lexContinuation(this, leadingTrivia, isTaggedTemplate));
  }

  public reLexUntaggedTemplate(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.templateLiteralLexer.reLexUntagged(this, leadingTrivia));
  }

  public reLexAsterisk(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.lexPunctuator(leadingTrivia, TypeScriptAsteriskNode));
  }

  public reLexQuestion(leadingTrivia: Node | undefined): Node {
    return this.lexWith(() => this.lexPunctuator(leadingTrivia, TypeScriptQuestionNode));
  }

  private lexPunctuator(leadingTrivia: Node | undefined, nodeType: ValueNodeType<ValueNode>): ValueNode {
    const startOffset = this.reader.currentOffset;
    this.reader.advance();
    return new nodeType(this.reader.createSpan(startOffset, 1), leadingTrivia);
  }
}
