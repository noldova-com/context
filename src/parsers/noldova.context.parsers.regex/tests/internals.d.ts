/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Supplies test-local types for the installed package's internal modules and extensions.
 * These declarations must stay synchronized with their implementations;
 * they do not enforce access permissions or ship with production code.
 *
 * This file is a script, not a module: it must contain no top-level import or
 * export. Top-level blocks declare internal modules; a nested module block
 * augments an existing module without replacing its public declarations.
 */

declare module "@noldova/context.parsers.regex/models/regex-group-name.js" {
  export class RegexGroupName {
    public readonly value: string;
    public readonly isValid: boolean;

    public constructor(value: string, isValid: boolean);
  }
}

declare module "@noldova/context.parsers.regex/models/regex-parser-context.js" {
  import { ParserContext, SourceSpan } from "@noldova/context.parsers";

  export class RegexParserContext extends ParserContext {
    public nestingDepth: number;
    public readonly diagnosedReservedPunctuatorOffsets: Set<number>;

    public claimCapturingGroupIndex(): number;
    public beginDisjunction(): number;
    public enterAlternative(disjunctionIndex: number, alternativeIndex: number): void;
    public leaveAlternative(): void;
    public registerNamedCapturingGroup(groupName: string, span: SourceSpan): void;
  }
}

declare module "@noldova/context.parsers.regex/services/lexers/regex.lexer.js" {
  import { DiagnosticCollector, Lexer, Node, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
  import { RegexFlagsNode } from "@noldova/context.parsers.regex";

  export class RegexLexer extends Lexer {
    public readonly flagsNode: RegexFlagsNode;
    public readonly inputSpan: SourceSpan;

    public constructor(source: Source, patternSpan: SourceSpan, flagsSpan: SourceSpan, inputSpan: SourceSpan, diagnosticCollector: DiagnosticCollector);
    public constructor(reader: SourceReader, flagsSpan: SourceSpan, inputSpan: SourceSpan, diagnosticCollector: DiagnosticCollector);

    public get capturingGroupCount(): number;
    public get hasNamedCapturingGroups(): boolean;
    public get isInCharacterClass(): boolean;
    public get isInGroupName(): boolean;
    public get unicodeMode(): boolean;
    public get unicodeSetsMode(): boolean;

    public enterCharacterClass(): void;
    public leaveCharacterClass(): void;
    public enterGroupName(): void;
    public leaveGroupName(): void;
    public hasNamedCapturingGroup(groupName: string): boolean;

    protected override lexNode(): Node;
  }
}

declare module "@noldova/context.parsers.regex/services/regex-syntax.parser.js" {
  import { Node, Parser, SourceSpan } from "@noldova/context.parsers";
  import {
    RegexAlternativeNode,
    RegexCharacterClassNode,
    RegexClassStringDisjunctionNode,
    RegexDisjunctionNode,
    RegexNode,
    RegexQuantifierNode
  } from "@noldova/context.parsers.regex";
  import { RegexParserContext } from "@noldova/context.parsers.regex/models/regex-parser-context.js";
  import { RegexLexer } from "@noldova/context.parsers.regex/services/lexers/regex.lexer.js";

  export class RegexSyntaxParser extends Parser<RegexNode, RegexParserContext> {
    public readonly regexLexer: RegexLexer;

    public constructor(context: RegexParserContext, lexer: RegexLexer);

    public parseAlternative(stopsAtCloseParenthesis: boolean): RegexAlternativeNode;
    public parseAssertion(): Node | undefined;
    public parseCharacterClass(): RegexCharacterClassNode;
    public parseClassSetExpression(): Node;
    public parseClassStringDisjunction(): RegexClassStringDisjunctionNode;
    public parseDisjunction(stopsAtCloseParenthesis: boolean): RegexDisjunctionNode;
    public parseGroup(): Node;
    public parseQuantifier(): RegexQuantifierNode | undefined;
    public parseTerm(): readonly Node[];

    protected override parseRootNode(): RegexNode;
  }

  module "@noldova/context.parsers" {
    interface Node {
      getRegexCharacterValue(): number | undefined;
      getRegexQuantifierMinimum(): bigint | undefined;
      getRegexQuantifierMaximum(): bigint | undefined;
      isSimpleRegexAssertion(): boolean;
      isRegexClassSetOperator(): boolean;
      mayContainRegexStrings(): boolean;
      createRegexClassSetExpression(operands: readonly Node[], span: SourceSpan): Node;
      parseRegexAtom(parser: RegexSyntaxParser): Node | undefined;
    }
  }
}
