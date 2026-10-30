/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Supplies test-local declarations for installed internal modules and extensions.
 * Keep this file a script; nested augmentation preserves the public API.
 */

declare module "@noldova/context.parsers.typescript/models/diagnostics/typescript-diagnostic-templates.js" {
  import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

  export class TypeScriptDiagnosticTemplates {
    static readonly [code: `TS${number}`]: DiagnosticTemplate;
    public static readonly TS1005: DiagnosticTemplate;
    public static readonly TS1109: DiagnosticTemplate;
    public static readonly TS1434: DiagnosticTemplate;
  }
}

declare module "@noldova/context.parsers.typescript/extensions/diagnostic-collector.extensions.js" {
  import type { DiagnosticRelatedInformation, DiagnosticTemplate } from "@noldova/context.diagnostics";
  import type { Source, SourceSpan } from "@noldova/context.parsers";

  module "@noldova/context.parsers" {
    interface DiagnosticCollector {
      addTypeScriptGrammarDiagnostic(source: Source, template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
      getLastTypeScriptParseDiagnosticIndex(): number;
      hasTypeScriptParseDiagnosticsSince(count: number): boolean;
      addTypeScriptMissingClosingDelimiterDiagnostic(source: Source, span: SourceSpan, openingSpan: SourceSpan | undefined, openingText: string,
      closingText: string): void;
      relateTypeScriptOpeningDelimiter(source: Source, openingSpan: SourceSpan, openingText: string, closingText: string): void;
      createTypeScriptOpeningDelimiterInformation(source: Source, openingSpan: SourceSpan, openingText: string, closingText: string): DiagnosticRelatedInformation;
      isLastTypeScriptParseDiagnosticAt(offset: number): boolean;
      addTypeScriptParseDiagnostic(template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
    }
  }
}

declare module "@noldova/context.parsers.typescript/services/keyword-spelling-suggester.js" {
  export class KeywordSpellingSuggester {
    public suggest(word: string): string | undefined;
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/readers/typescript-unicode-escape.reader.js" {
  import type { SourceReader } from "@noldova/context.parsers";

  export class TypeScriptUnicodeEscapeReader {
    public read(reader: SourceReader): number | undefined;
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js" {
  import { DiagnosticCollector, Lexer, Node, Source, SourceReader } from "@noldova/context.parsers";

  export class TypeScriptLexer extends Lexer {
    public readonly commentDirectiveOffsets: number[];
    public precedingNode: Node | undefined;
    public constructor(sourceOrReader: Source | SourceReader, diagnosticCollector: DiagnosticCollector, commentDirectiveOffsets: number[]);
    public reLexGreaterThan(leadingTrivia: Node | undefined): Node;
    public reLexRegularExpression(leadingTrivia: Node | undefined): Node;

    protected override lexNode(): Node;
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/typescript-character-classifier.js" {
  export class TypeScriptCharacterClassifier {
    public static isLineTerminator(character: string): boolean;
    public static isWhitespace(character: string): boolean;
    public static isIdentifierStart(codePoint: number): boolean;
    public static isIdentifierPart(codePoint: number): boolean;
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/trivia.lexer.js" {
  import { Node } from "@noldova/context.parsers";
  import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";

  export class TriviaLexer {
    public lex(lexer: TypeScriptLexer): Node | undefined;
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/readers/typescript-identifier-value.reader.js" {
  import { SourceReader } from "@noldova/context.parsers";

  export class TypeScriptIdentifierValueReader {
    public read(reader: SourceReader): string | undefined;
  }
}

declare module "@noldova/context.parsers.typescript/services/parsers/declarations/enum-member.parser.js" {
  import type { TypeScriptEnumMemberNode } from "@noldova/context.parsers.typescript";
  import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  export class EnumMemberParser {
    public constructor(typescriptParser: TypeScriptSyntaxParser);
    public parse(): TypeScriptEnumMemberNode;
  }
}

declare module "@noldova/context.parsers.typescript/services/parsers/declarations/interface-declaration.parser.js" {
  import type { TypeScriptInterfaceDeclarationNode, TypeScriptInterfaceKeywordNode } from "@noldova/context.parsers.typescript";
  import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  export class InterfaceDeclarationParser {
    public constructor(typescriptParser: TypeScriptSyntaxParser);
    public parse(keywordNode: TypeScriptInterfaceKeywordNode): TypeScriptInterfaceDeclarationNode;
  }
}

declare module "@noldova/context.parsers.typescript/services/parsers/names/identifier-name.parser.js" {
  import type { Node } from "@noldova/context.parsers";
  import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  export class IdentifierNameParser {
    public constructor(parser: TypeScriptSyntaxParser);
    public parseIdentifierOrStringName(): Node | undefined;
    public parseIdentifierName(): Node | undefined;
    public parseBindingIdentifier(): Node | undefined;
  }
}

declare module "@noldova/context.parsers.typescript/exceptions/typescript-parser.exception.js" {
  import { ParserException } from "@noldova/context.parsers";

  export class TypeScriptParserException extends ParserException { }
}

declare module "@noldova/context.parsers.typescript/exceptions/typescript-recursion-limit.exception.js" {
  import { SourceSpan } from "@noldova/context.parsers";
  import { TypeScriptParserException } from "@noldova/context.parsers.typescript/exceptions/typescript-parser.exception.js";

  export class TypeScriptRecursionLimitException extends TypeScriptParserException {
    public readonly span: SourceSpan;
    public constructor(span: SourceSpan);
  }
}

declare module "@noldova/context.parsers.typescript/models/diagnostics/typescript-parser-diagnostic-templates.js" {
  import { DiagnosticTemplate } from "@noldova/context.diagnostics";

  export class TypeScriptParserDiagnosticTemplates {
    public static readonly CTX2000: DiagnosticTemplate;
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-list-scope.js" {
  import type { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";

  export class TypeScriptListScope {
    public readonly parent: TypeScriptListScope | undefined;
    public readonly kind: TypeScriptListKind | undefined;
    public readonly nestedScopes: Map<TypeScriptListKind, TypeScriptListScope>;
    public constructor(parent?: TypeScriptListScope, kind?: TypeScriptListKind);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-reparsed-region.js" {
  import type { Diagnostic } from "@noldova/context.diagnostics";
  import type { Node, SourceSpan } from "@noldova/context.parsers";
  import type { TypeScriptDeferredRecords } from "@noldova/context.parsers.typescript/models/typescript-deferred-records.js";

  export class TypeScriptReparsedRegion {
    public readonly statements: readonly Node[];
    public readonly diagnostics: readonly Diagnostic[];
    public readonly span: SourceSpan;
    public readonly records: TypeScriptDeferredRecords;
    public constructor(statements: readonly Node[], diagnostics: readonly Diagnostic[], span: SourceSpan, records: TypeScriptDeferredRecords);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-region-set.js" {
  import type { SourceSpan } from "@noldova/context.parsers";

  export class TypeScriptRegionSet {
    public constructor(spans: readonly SourceSpan[]);
    public readonly isEmpty: boolean;
    public contains(offset: number): boolean;
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-deferred-records.js" {
  import type { Node, SourceSpan } from "@noldova/context.parsers";
  import type { TypeScriptObjectLiteralExpressionNode, TypeScriptParameterNode } from "@noldova/context.parsers.typescript";
  import type { TypeScriptRecordMark } from "@noldova/context.parsers.typescript/models/typescript-record-mark.js";
  import type { TypeScriptRegionSet } from "@noldova/context.parsers.typescript/models/typescript-region-set.js";
  import type { TypeScriptReservedBindingName } from "@noldova/context.parsers.typescript/models/typescript-reserved-binding-name.js";
  import type { TypeScriptWrittenAwait } from "@noldova/context.parsers.typescript/models/typescript-written-await.js";

  export class TypeScriptDeferredRecords {
    public hasImportMeta: boolean;
    public awaitNameCount: number;
    public readonly reservedBindingNames: readonly TypeScriptReservedBindingName[];
    public readonly writtenAwaits: TypeScriptWrittenAwait[];
    public readonly writtenGlobalExports: Node[];
    public readonly writtenTypePredicates: Node[];
    public readonly writtenObjectLiterals: TypeScriptObjectLiteralExpressionNode[];
    public readonly patternLiterals: Node[];
    public readonly misplacedParameterProperties: TypeScriptParameterNode[];
    public readonly uncheckedSpans: SourceSpan[];
    public readonly commentDirectiveOffsets: number[];
    public recordReservedBindingName(reservedName: TypeScriptReservedBindingName): void;
    public readReservedNameAsBinding(nameNode: Node): void;
    public mark(): TypeScriptRecordMark;
    public release(mark: TypeScriptRecordMark): void;
    public replaceRegions(regions: TypeScriptRegionSet, regionRecords: readonly TypeScriptDeferredRecords[]): void;
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-name-reservation.js" {
  export enum TypeScriptNameReservation {
    None = "None",
    Strict = "Strict",
    Await = "Await",
    EvalOrArguments = "EvalOrArguments"
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-reserved-binding-name.js" {
  import type { Node } from "@noldova/context.parsers";
  import type { TypeScriptNameReservation } from "@noldova/context.parsers.typescript/enums/typescript-name-reservation.js";

  export class TypeScriptReservedBindingName {
    public readonly hasEnclosingClass: boolean;
    public readonly isAwaitContext: boolean;
    public readonly isSourceTopLevel: boolean;
    public readonly nameNode: Node;
    public readonly reservation: TypeScriptNameReservation;
    public constructor(nameNode: Node, reservation: TypeScriptNameReservation, hasEnclosingClass: boolean, isAwaitContext: boolean,
      isSourceTopLevel: boolean);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-written-await.js" {
  import type { Node } from "@noldova/context.parsers";

  export class TypeScriptWrittenAwait {
    public readonly isForAwait: boolean;
    public readonly isSourceTopLevel: boolean;
    public readonly keywordNode: Node;
    public constructor(keywordNode: Node, isForAwait: boolean, isSourceTopLevel: boolean);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-record-mark.js" {
  export class TypeScriptRecordMark {
    public readonly awaitNameCount: number;
    public readonly commentDirectiveOffsetCount: number;
    public readonly hasImportMeta: boolean;
    public readonly misplacedParameterPropertyCount: number;
    public readonly patternLiteralCount: number;
    public readonly reservedBindingNameCount: number;
    public readonly uncheckedSpanCount: number;
    public readonly writtenAwaitCount: number;
    public readonly writtenGlobalExportCount: number;
    public readonly writtenObjectLiteralCount: number;
    public readonly writtenTypePredicateCount: number;
    public constructor(
      hasImportMeta: boolean,
      awaitNameCount: number,
      writtenAwaitCount: number,
      writtenGlobalExportCount: number,
      reservedBindingNameCount: number,
      writtenTypePredicateCount: number,
      writtenObjectLiteralCount: number,
      patternLiteralCount: number,
      misplacedParameterPropertyCount: number,
      uncheckedSpanCount: number,
      commentDirectiveOffsetCount: number);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-parser-context.js" {
  import { ParserContext, Source, SourceSpan } from "@noldova/context.parsers";
  import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
  import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
  import type { TypeScriptDeferredRecords } from "@noldova/context.parsers.typescript/models/typescript-deferred-records.js";
  import { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  export class TypeScriptParserContext extends ParserContext {
    public constructor(source: Source, isDeclaration?: boolean);
    public hasReadListBoundary: boolean;
    public isClassBodyContext: boolean;
    public isSubstatement: boolean;
    public contextFlags: TypeScriptContextFlags;
    public readonly isAwaitContext: boolean;
    public readonly isDecoratorContext: boolean;
    public readonly isDisallowInContext: boolean;
    public readonly isYieldContext: boolean;
    public getRejectedArrowOffsets(flags: TypeScriptContextFlags): Set<number>;
    public getSharedRejectedArrowOffsets(flags: TypeScriptContextFlags): Set<number>;
    public readonly unclosedTypeArgumentOffsets: Set<number>;
    public readonly records: TypeScriptDeferredRecords;

    public clearRecognitionCaches(): void;
    public enterList(kind: TypeScriptListKind): void;
    public leaveList(): void;
    public isListBoundary(parser: TypeScriptSyntaxParser): boolean;
    public enterRecursion(span: SourceSpan): void;
    public leaveRecursion(): void;
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-declaration-list-holder.js" {
  export enum TypeScriptDeclarationListHolder {
    Statement = "Statement",
    ForHeader = "ForHeader",
    ForInOrOfHeader = "ForInOrOfHeader"
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-decorator-support.js" {
  export enum TypeScriptDecoratorSupport {
    Supported = "Supported",
    Unsupported = "Unsupported",
    Overload = "Overload"
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-modifier-flags.js" {
  export enum TypeScriptModifierFlags {
    None = 0,
    Accessibility = 1,
    Static = 2,
    Readonly = 4,
    Abstract = 8,
    Async = 16,
    Declare = 32,
    Export = 64,
    Override = 128,
    Accessor = 256,
    Private = 512,
    All = 1023
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-modifier-target.js" {
  export enum TypeScriptModifierTarget {
    ModuleElement = "ModuleElement",
    ClassElement = "ClassElement",
    TypeMember = "TypeMember",
    Parameter = "Parameter"
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-object-member-kind.js" {
  export enum TypeScriptObjectMemberKind {
    None = 0,
    Property = 1,
    Method = 2,
    Get = 4,
    Set = 8
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-type-parameter-annotations.js" {
  export enum TypeScriptTypeParameterAnnotations {
    None = 0,
    Const = 1,
    In = 2,
    Out = 4,
    Variance = 6
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-context-flags.js" {
  export enum TypeScriptContextFlags {
    None = 0,
    Await = 1,
    Yield = 2,
    Decorator = 4,
    TopLevelAwait = 8,
    ConditionalTrueBranch = 16,
    DisallowConditionalTypes = 32,
    ClassBodyRecovery = 64,
    DisallowIn = 128
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-list-kind.js" {
  export enum TypeScriptListKind {
    SourceElements = "SourceElements",
    BlockStatements = "BlockStatements",
    SwitchClauses = "SwitchClauses",
    SwitchClauseStatements = "SwitchClauseStatements",
    TypeMembers = "TypeMembers",
    ClassMembers = "ClassMembers",
    EnumMembers = "EnumMembers",
    HeritageClauseElement = "HeritageClauseElement",
    VariableDeclarations = "VariableDeclarations",
    ObjectBindingElements = "ObjectBindingElements",
    ArrayBindingElements = "ArrayBindingElements",
    ArgumentExpressions = "ArgumentExpressions",
    ObjectLiteralMembers = "ObjectLiteralMembers",
    ArrayLiteralMembers = "ArrayLiteralMembers",
    Parameters = "Parameters",
    TypeParameters = "TypeParameters",
    TypeArguments = "TypeArguments",
    TupleElementTypes = "TupleElementTypes",
    HeritageClauses = "HeritageClauses",
    ImportOrExportSpecifiers = "ImportOrExportSpecifiers",
    ImportAttributes = "ImportAttributes"
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-arrow-head-kind.js" {
  export enum TypeScriptArrowHeadKind {
    NotArrow = "NotArrow",
    Arrow = "Arrow",
    Ambiguous = "Ambiguous",
    Parameters = "Parameters"
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js" {
  export enum TypeScriptOperatorPrecedence {
    None = 0,
    NullishCoalescing = 5,
    LogicalOr = 5,
    LogicalAnd = 6,
    BitwiseOr = 7,
    BitwiseXor = 8,
    BitwiseAnd = 9,
    Equality = 10,
    Relational = 11,
    Shift = 12,
    Additive = 13,
    Multiplicative = 14,
    Exponentiation = 15
  }
}

declare module "@noldova/context.parsers.typescript/enums/typescript-associativity.js" {
  export enum TypeScriptAssociativity {
    None = "None",
    Left = "Left",
    Right = "Right"
  }
}

declare module "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js" {
  import { Node, Parser } from "@noldova/context.parsers";
  import { TypeScriptArrowFunctionNode, TypeScriptNode, TypeScriptTypeArgumentListNode } from "@noldova/context.parsers.typescript";
  import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
  import { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";

  export class TypeScriptSyntaxParser extends Parser<TypeScriptNode, TypeScriptParserContext> {
    public readonly typescriptLexer: TypeScriptLexer;

    public constructor(context: TypeScriptParserContext, lexer: TypeScriptLexer);
    public consumeName(): Node;

    public parseExpression(): Node;
    public parseExpressionAllowingIn(): Node;
    public parseExpressionWithoutIn(): Node;
    public parseAssignmentExpression(): Node;
    public parseAssignmentExpressionOrParameter(): Node;
    public parseAssignmentExpressionAllowingIn(): Node;
    public parseUnaryExpression(operandNode?: Node): Node;
    public parsePrimaryExpression(): Node;
    public parseStatement(): Node;
    public isDeclarationStart(): boolean;
    public tryParseArrowFunction(): TypeScriptArrowFunctionNode | undefined;
    public tryParseParenthesizedExpressionOrArrowFunction(): Node | undefined;
    public tryParseTypeArgumentExpressionSuffix(): TypeScriptTypeArgumentListNode | undefined;
    public parseType(): Node;
    public parseReturnType(): Node;
    public reLexGreaterThan(): void;
    public reLexRegularExpression(): void;
    public hasPrecedingLineBreak(): boolean;
    public reportExpected(text: string): void;

    protected override parseRootNode(): TypeScriptNode;
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/node.extensions.js" {
  import { Node, NodeType, ValueNode } from "@noldova/context.parsers";
  import {
    TypeScriptAccessorKindKeywordNode,
    TypeScriptAwaitKeywordNode,
    TypeScriptBindingElementNode,
    TypeScriptCaseClauseNode,
    TypeScriptConstKeywordNode,
    TypeScriptConstructorKeywordNode,
    TypeScriptDefaultClauseNode,
    TypeScriptLetKeywordNode,
    TypeScriptNoSubstitutionTemplateLiteralNode,
    TypeScriptParameterNode,
    TypeScriptStringLiteralNode,
    TypeScriptTemplateHeadNode,
    TypeScriptTypeKeywordNode,
    TypeScriptUsingKeywordNode,
    TypeScriptVarKeywordNode,
    TypeScriptYieldKeywordNode
  } from "@noldova/context.parsers.typescript";
  import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
  import type { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
  import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
  import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
  import { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  module "@noldova/context.parsers" {
    interface Node {
      getTypeScriptPrecedence(): TypeScriptOperatorPrecedence;
      getTypeScriptAssociativity(): TypeScriptAssociativity;
      isTypeScriptMisplacedModifier(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptParameter(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptTypeParameter(): boolean;
      isTypeScriptListElement(kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean;
      getTypeScriptMissingNodeDiagnosticSpan(): SourceSpan;
      getTypeScriptMissingNodeSpan(): SourceSpan;
      validateTypeScriptGrammar(context: TypeScriptParserContext): void;
      reportTypeScriptGrammarAfterModifiers(context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void;
      canFollowTypeScriptTypeArguments(parser: TypeScriptSyntaxParser): boolean;
      reportTypeScriptInstantiationAccess(parser: TypeScriptSyntaxParser): void;
      isTypeScriptLeftHandSideExpression(): boolean;
      canStartTypeScriptVariableDeclaration(): boolean;
      reportTypeScriptInvalidVariableDeclaration(parser: TypeScriptSyntaxParser): void;
      isTypeScriptForVariableDeclarationStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode;
      isTypeScriptUnexpectedStatementToken(parser: TypeScriptSyntaxParser): boolean;
      reportTypeScriptUnexpectedStatementToken(parser: TypeScriptSyntaxParser, kind: TypeScriptListKind): void;
      reportTypeScriptMissingSemicolon(parser: TypeScriptSyntaxParser): void;
      validateTypeScriptBinaryOperands(context: TypeScriptParserContext, leftNode: Node, rightNode: Node): void;
      parseTypeScriptUnaryExpression(parser: TypeScriptSyntaxParser): Node;
      isTypeScriptDeclarationModifier(): boolean;
      canParseTypeScriptDeclarationModifier(parser: TypeScriptSyntaxParser, writtenNodes?: readonly Node[]): boolean;
      parseTypeScriptPrimaryExpression(parser: TypeScriptSyntaxParser): Node;
      hasTypeScriptKeywordEscape(): boolean;
      isTypeScriptIdentifier(context: TypeScriptParserContext): boolean;
      isTypeScriptExternalModuleIndicator(): boolean;
      getTypeScriptDeclarationNameSpan(context: TypeScriptParserContext): SourceSpan;
      getTypeScriptFirstTokenSpan(): SourceSpan;
      getTypeScriptFirstChild(): Node;
      getTypeScriptOuterExpressionOperand(): Node;
      skipTypeScriptOuterExpressions(): Node;
      isTypeScriptOptionalChain(): boolean;
      isTypeScriptTypeAliasStart(parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode;
      isTypeScriptAwaitExpressionStart(parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode;
      isTypeScriptYieldExpressionStart(parser: TypeScriptSyntaxParser): this is TypeScriptYieldKeywordNode;
      canFollowTypeScriptUnscopedAwaitOrYield(): boolean;
      canStartTypeScriptExpression(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptLeftHandSideExpression(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptPrimaryExpression(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptHeritageExpression(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptVariableStatementStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode;
      isTypeScriptVariableDeclarationKeyword(): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode;
      canStartTypeScriptSignature(): boolean;
      canStartTypeScriptGenericList(): boolean;
      isTypeScriptUpdateOperator(): boolean;
      canFollowTypeScriptModifier(): boolean;
      isTypeScriptLogicalOperator(): this is ValueNode;
      getTypeScriptLogicalOperatorNode(): ValueNode | undefined;
      isTypeScriptOptionalParameter(): boolean;
      containsTypeScriptLineBreak(): boolean;
      isTypeScriptParameterModifier(): boolean;
      canParseTypeScriptParameterModifier(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptClassMemberModifier(): boolean;
      canStartTypeScriptClassMember(parser: TypeScriptSyntaxParser): boolean;
      startsTypeScriptAccessor(parser: TypeScriptSyntaxParser): this is TypeScriptAccessorKindKeywordNode;
      startsTypeScriptClassStaticBlock(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptImportPhase(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptRecoveryStatement(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptTypeMember(parser: TypeScriptSyntaxParser): boolean;
      startsTypeScriptFromClause(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptListTerminator(kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptStatement(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptSwitchClauseStart(): boolean;
      parseTypeScriptSwitchClause(parser: TypeScriptSyntaxParser): TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode | undefined;
      tryParseTypeScriptAssignmentStart(parser: TypeScriptSyntaxParser): Node | undefined;
      parseTypeScriptStatement(parser: TypeScriptSyntaxParser, modifierNodes?: readonly Node[]): Node;
      isTypeScriptDeclarationStart(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptConstructorDeclarationStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode;
      isTypeScriptLiteralTypeToken(): boolean;
      isTypeScriptTypeParameterModifier(): boolean;
      isTypeScriptTypeMemberModifier(): boolean;
      canFollowTypeScriptOptionalParameterMarker(): boolean;
      isTypeScriptFunctionTypeParameterIndicator(): boolean;
      isTypeScriptIndexSignatureParameterIndicator(parser: TypeScriptSyntaxParser): boolean;
      isTypeScriptAssignmentOperator(): boolean;
      isTypeScriptPrefixUnaryOperator(): boolean;
      isTypeScriptPredefinedTypeKeyword(): boolean;
      isTypeScriptStringOrNumericLiteral(): boolean;
      isTypeScriptTemplateStart(): this is TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode;
      canStartTypeScriptPropertyName(): boolean;
      isTypeScriptAccessName(): boolean;
      isTypeScriptModuleExportName(): boolean;
      isTypeScriptIdentifierName(): boolean;
      getTypeScriptDiagnosticText(): string;
      getTypeScriptTokenValue(): string | undefined;
      isTypeScriptBindingIdentifier(): boolean;
      isTypeScriptAsyncFunctionStart(parser: TypeScriptSyntaxParser): boolean;
      canStartTypeScriptBindingName(): boolean;
      isTypeScriptTypeOperator(): boolean;
      canStartTypeScriptType(parser: TypeScriptSyntaxParser): boolean;
      toTypeScriptBindingName(): Node | undefined;
      toTypeScriptBindingElement(): TypeScriptBindingElementNode | undefined;
      toTypeScriptParameter(): TypeScriptParameterNode | undefined;
      getTypeScriptClosingDelimiterType(): NodeType<Node> | undefined;
      isTypeScriptClosingDelimiter(): boolean;
    }
  }
}

declare module "@noldova/context.parsers.typescript/services/lexers/readers/typescript-string-value.reader.js" {
  import type { SourceReader } from "@noldova/context.parsers";

  export class TypeScriptStringValueReader {
    public read(reader: SourceReader): string | undefined;
    public readTokenValue(reader: SourceReader): string;
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-jump-target.js" {
  import type { Node } from "@noldova/context.parsers";

  export class TypeScriptJumpTarget {
    public static readonly ofIteration: TypeScriptJumpTarget;
    public static readonly ofSwitch: TypeScriptJumpTarget;
    public readonly isIteration: boolean;
    public readonly labelNode: Node | undefined;
    public constructor(labelNode: Node | undefined, isIteration: boolean);
  }
}

declare module "@noldova/context.parsers.typescript/models/trivia/typescript-directive-argument.js" {
  import type { SourceSpan } from "@noldova/context.parsers";

  export class TypeScriptDirectiveArgument {
    public readonly span: SourceSpan;
    public readonly value: string;
    public constructor(value: string, span: SourceSpan);
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-binder-diagnostic.js" {
  import { TypeScriptGrammarDiagnostic } from "@noldova/context.parsers.typescript/models/typescript-grammar-diagnostic.js";

  export class TypeScriptBinderDiagnostic extends TypeScriptGrammarDiagnostic {
  }
}

declare module "@noldova/context.parsers.typescript/models/typescript-grammar-diagnostic.js" {
  import { Diagnostic } from "@noldova/context.diagnostics";

  export class TypeScriptGrammarDiagnostic extends Diagnostic {
    public readonly diagnostic: Diagnostic;
    public constructor(diagnostic: Diagnostic);
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/keywords/typescript-accessor-kind-keyword.node.extensions.js" {
  import type { Node, SourceSpan } from "@noldova/context.parsers";
  import type {
    TypeScriptAccessorNode,
    TypeScriptBlockNode,
    TypeScriptColonNode,
    TypeScriptCommaNode,
    TypeScriptParameterListNode,
    TypeScriptSemicolonNode,
    TypeScriptTypeParameterListNode
  } from "@noldova/context.parsers.typescript";

  module "@noldova/context.parsers.typescript" {
    interface TypeScriptAccessorKindKeywordNode {
      createTypeScriptAccessor(
        modifierNodes: readonly Node[],
        span: SourceSpan,
        nameNode: Node,
        parameterListNode: TypeScriptParameterListNode,
        typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
        colonNode: TypeScriptColonNode | undefined,
        returnTypeNode: Node | undefined,
        bodyNode: TypeScriptBlockNode | undefined,
        terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined,
        leadingTrivia: Node | undefined,
        trailingTrivia: Node | undefined): TypeScriptAccessorNode;
    }
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/declarations/typescript-variable-declaration-list.node.extensions.js" {
  module "@noldova/context.parsers.typescript" {
    interface TypeScriptVariableDeclarationListNode {
      getTypeScriptKeywordText(): string;
    }
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/statements/typescript-block.node.extensions.js" {
  module "@noldova/context.parsers.typescript" {
    interface TypeScriptBlockNode {
      isTypeScriptPresent(): boolean;
    }
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/delimiters/typescript-dot-dot-dot.node.extensions.js" {
  import type { TypeScriptSpreadElementNode } from "@noldova/context.parsers.typescript";
  import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";

  module "@noldova/context.parsers.typescript" {
    interface TypeScriptDotDotDotNode {
      parseTypeScriptSpreadElement(parser: TypeScriptSyntaxParser): TypeScriptSpreadElementNode;
    }
  }
}

declare module "@noldova/context.parsers.typescript/extensions/nodes/typescript-delimited-list.node.extensions.js" {
  import type { TypeScriptCommaNode } from "@noldova/context.parsers.typescript";

  module "@noldova/context.parsers.typescript" {
    interface TypeScriptDelimitedListNode {
      getTypeScriptTrailingComma(): TypeScriptCommaNode | undefined;
    }
  }
}
