/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";
import { type DiagnosticCollector, EndOfFileNode, Lexer, type Node, type Source, SourceReader, type SourceSpan, type ValueNode, type ValueNodeType } from "@noldova/context.parsers";

import { RegexEndAssertionNode } from "../../models/nodes/assertions/regex-end-assertion.node.js";
import { RegexStartAssertionNode } from "../../models/nodes/assertions/regex-start-assertion.node.js";
import { RegexAmpersandAmpersandNode } from "../../models/nodes/punctuators/regex-ampersand-ampersand.node.js";
import { RegexAsteriskNode } from "../../models/nodes/punctuators/regex-asterisk.node.js";
import { RegexBarNode } from "../../models/nodes/punctuators/regex-bar.node.js";
import { RegexCloseBraceNode } from "../../models/nodes/punctuators/regex-close-brace.node.js";
import { RegexCloseBracketNode } from "../../models/nodes/punctuators/regex-close-bracket.node.js";
import { RegexCloseParenthesisNode } from "../../models/nodes/punctuators/regex-close-parenthesis.node.js";
import { RegexColonNode } from "../../models/nodes/punctuators/regex-colon.node.js";
import { RegexCommaNode } from "../../models/nodes/punctuators/regex-comma.node.js";
import { RegexEqualsNode } from "../../models/nodes/punctuators/regex-equals.node.js";
import { RegexExclamationNode } from "../../models/nodes/punctuators/regex-exclamation.node.js";
import { RegexGreaterThanNode } from "../../models/nodes/punctuators/regex-greater-than.node.js";
import { RegexHyphenHyphenNode } from "../../models/nodes/punctuators/regex-hyphen-hyphen.node.js";
import { RegexHyphenNode } from "../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexLessThanNode } from "../../models/nodes/punctuators/regex-less-than.node.js";
import { RegexOpenBraceNode } from "../../models/nodes/punctuators/regex-open-brace.node.js";
import { RegexOpenBracketNode } from "../../models/nodes/punctuators/regex-open-bracket.node.js";
import { RegexOpenParenthesisNode } from "../../models/nodes/punctuators/regex-open-parenthesis.node.js";
import { RegexPlusNode } from "../../models/nodes/punctuators/regex-plus.node.js";
import { RegexQuestionNode } from "../../models/nodes/punctuators/regex-question.node.js";
import { RegexDotNode } from "../../models/nodes/regex-dot.node.js";
import { RegexFlagsNode } from "../../models/nodes/regex-flags.node.js";
import type { RegexCapturingGroupSummary } from "../../models/regex-capturing-group-summary.js";
import { Resources } from "../../resources.js";
import { RegexCapturingGroupSummaryReader } from "../readers/regex-capturing-group-summary.reader.js";
import { CharacterLexer } from "./character.lexer.js";
import { EscapeLexer } from "./escape.lexer.js";

export class RegexLexer extends Lexer {
  private readonly capturingGroupSummary: RegexCapturingGroupSummary;
  private readonly characterLexer: CharacterLexer = new CharacterLexer();
  private readonly escapeLexer: EscapeLexer = new EscapeLexer();
  private characterClassDepth: number = 0;
  private groupNameDepth: number = 0;

  public readonly flagsNode: RegexFlagsNode;
  public readonly inputSpan: SourceSpan;

  public constructor(source: Source, patternSpan: SourceSpan, flagsSpan: SourceSpan, inputSpan: SourceSpan, diagnosticCollector: DiagnosticCollector);
  public constructor(reader: SourceReader, flagsSpan: SourceSpan, inputSpan: SourceSpan, diagnosticCollector: DiagnosticCollector);
  public constructor(...constructorArguments:
    [Source, SourceSpan, SourceSpan, SourceSpan, DiagnosticCollector] |
    [SourceReader, SourceSpan, SourceSpan, DiagnosticCollector]) {
    let diagnosticCollector: DiagnosticCollector;
    let flagsSpan: SourceSpan;
    let reader: SourceReader;
    let resolvedInputSpan: SourceSpan;

    if (constructorArguments.length === 4)
      [reader, flagsSpan, resolvedInputSpan, diagnosticCollector] = constructorArguments;
    else {
      const [source, patternSpan, sourceFlagsSpan, sourceInputSpan, sourceDiagnosticCollector] = constructorArguments;
      reader = new SourceReader(source, patternSpan);
      flagsSpan = sourceFlagsSpan;
      resolvedInputSpan = sourceInputSpan;
      diagnosticCollector = sourceDiagnosticCollector;

      if (flagsSpan.startOffset < patternSpan.endOffset)
        throw new ArgumentException(Resources.flagsOutsideInput, nameof<RegexLexer>(t => t.flagsNode));
    }

    const source = reader.source;
    source.getSpan(flagsSpan);
    source.getSpan(resolvedInputSpan);

    if (reader.currentOffset !== reader.startOffset)
      throw new ArgumentException(Resources.patternReaderMustStartAtRegionStart, nameof<RegexLexer>(t => t.reader));

    if (reader.startOffset < resolvedInputSpan.startOffset || reader.endOffset > resolvedInputSpan.endOffset)
      throw new ArgumentException(Resources.patternOutsideInput, nameof<RegexLexer>(t => t.reader));

    if (flagsSpan.startOffset < reader.endOffset || flagsSpan.endOffset > resolvedInputSpan.endOffset)
      throw new ArgumentException(Resources.flagsOutsideInput, nameof<RegexLexer>(t => t.flagsNode));

    super(reader, diagnosticCollector);
    this.inputSpan = resolvedInputSpan;
    this.flagsNode = new RegexFlagsNode(source.getText(flagsSpan), flagsSpan);
    this.capturingGroupSummary = new RegexCapturingGroupSummaryReader().read(reader, this.unicodeSetsMode);
  }

  public get capturingGroupCount(): number {
    return this.capturingGroupSummary.capturingGroupCount;
  }

  public get hasNamedCapturingGroups(): boolean {
    return this.capturingGroupSummary.namedCapturingGroupNames.size > 0;
  }

  public get isInCharacterClass(): boolean {
    return this.characterClassDepth > 0;
  }

  public get isInGroupName(): boolean {
    return this.groupNameDepth > 0;
  }

  public get unicodeMode(): boolean {
    return this.flagsNode.unicode || this.flagsNode.unicodeSets;
  }

  public get unicodeSetsMode(): boolean {
    return this.flagsNode.unicodeSets;
  }

  public enterCharacterClass(): void {
    this.characterClassDepth++;
  }

  public leaveCharacterClass(): void {
    this.characterClassDepth--;
  }

  public enterGroupName(): void {
    this.groupNameDepth++;
  }

  public leaveGroupName(): void {
    this.groupNameDepth--;
  }

  public hasNamedCapturingGroup(groupName: string): boolean {
    return this.capturingGroupSummary.namedCapturingGroupNames.has(groupName);
  }

  protected override lexNode(): Node {
    const reader = this.reader;
    if (reader.isAtEnd)
      return new EndOfFileNode(reader.createSpan(reader.currentOffset, 0));

    const character = reader.peekCodeUnit();
    if (character === Resources.backslash)
      return this.escapeLexer.lex(this);

    if (this.isInCharacterClass) {
      if (character === Resources.closeBracket) {
        const node = this.lexPunctuator(RegexCloseBracketNode);
        this.leaveCharacterClass();

        return node;
      }

      if (!this.unicodeSetsMode)
        return character === Resources.hyphen ? this.lexPunctuator(RegexHyphenNode) : this.characterLexer.lex(this, character);

      if (character === Resources.ampersandAmpersand.charAt(0) && reader.startsWith(Resources.ampersandAmpersand))
        return this.lexPunctuator(RegexAmpersandAmpersandNode, Resources.ampersandAmpersand.length);

      if (character === Resources.hyphen && reader.startsWith(Resources.hyphenHyphen))
        return this.lexPunctuator(RegexHyphenHyphenNode, Resources.hyphenHyphen.length);

      if (character !== Resources.openBracket && character !== Resources.hyphen && character !== Resources.bar && character !== Resources.closeBrace)
        return this.characterLexer.lex(this, character);
    }

    switch (character) {
      case Resources.caret:
        return this.lexStartAssertion();
      case Resources.dollar:
        return this.lexEndAssertion();
      case Resources.dot:
        return this.lexDot();
      case Resources.asterisk:
        return this.lexPunctuator(RegexAsteriskNode);
      case Resources.bar:
        return this.lexPunctuator(RegexBarNode);
      case Resources.closeBrace:
        return this.lexPunctuator(RegexCloseBraceNode);
      case Resources.closeBracket:
        return this.lexPunctuator(RegexCloseBracketNode);
      case Resources.closeParenthesis:
        return this.lexPunctuator(RegexCloseParenthesisNode);
      case Resources.colon:
        return this.lexPunctuator(RegexColonNode);
      case Resources.comma:
        return this.lexPunctuator(RegexCommaNode);
      case Resources.equals:
        return this.lexPunctuator(RegexEqualsNode);
      case Resources.exclamation:
        return this.lexPunctuator(RegexExclamationNode);
      case Resources.greaterThan:
        return this.lexPunctuator(RegexGreaterThanNode);
      case Resources.hyphen:
        return this.lexPunctuator(RegexHyphenNode);
      case Resources.lessThan:
        return this.lexPunctuator(RegexLessThanNode);
      case Resources.openBrace:
        return this.lexPunctuator(RegexOpenBraceNode);
      case Resources.openBracket: {
        const node = this.lexPunctuator(RegexOpenBracketNode);
        this.enterCharacterClass();
        return node;
      }
      case Resources.openParenthesis:
        return this.lexPunctuator(RegexOpenParenthesisNode);
      case Resources.plus:
        return this.lexPunctuator(RegexPlusNode);
      case Resources.question:
        return this.lexPunctuator(RegexQuestionNode);
      default:
        return this.characterLexer.lex(this, character);
    }
  }

  private lexDot(): RegexDotNode {
    const startOffset = this.reader.currentOffset;
    this.reader.advance();

    return new RegexDotNode(this.reader.createSpan(startOffset, Resources.dot.length));
  }

  private lexEndAssertion(): RegexEndAssertionNode {
    const startOffset = this.reader.currentOffset;
    this.reader.advance();

    return new RegexEndAssertionNode(this.reader.createSpan(startOffset, Resources.dollar.length));
  }

  private lexPunctuator(nodeType: ValueNodeType<ValueNode>, length: number = 1): ValueNode {
    const startOffset = this.reader.currentOffset;
    this.reader.advance(length);

    return new nodeType(this.reader.createSpan(startOffset, length));
  }

  private lexStartAssertion(): RegexStartAssertionNode {
    const startOffset = this.reader.currentOffset;
    this.reader.advance();

    return new RegexStartAssertionNode(this.reader.createSpan(startOffset, Resources.caret.length));
  }
}
