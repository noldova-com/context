/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { type Node, Parser, type ValueNode } from "@noldova/context.parsers";

import { TypeScriptArrowHeadKind } from "../enums/typescript-arrow-head-kind.js";
import { TypeScriptNameReservation } from "../enums/typescript-name-reservation.js";
import "../extensions/nodes/node.extensions.js";
import { TypeScriptDiagnosticTemplates } from "../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptCaseClauseNode } from "../models/nodes/clauses/typescript-case-clause.node.js";
import type { TypeScriptDefaultClauseNode } from "../models/nodes/clauses/typescript-default-clause.node.js";
import type { TypeScriptClassDeclarationNode } from "../models/nodes/declarations/typescript-class-declaration.node.js";
import type { TypeScriptEnumDeclarationNode } from "../models/nodes/declarations/typescript-enum-declaration.node.js";
import type { TypeScriptExportAssignmentNode } from "../models/nodes/declarations/typescript-export-assignment.node.js";
import type { TypeScriptExportDeclarationNode } from "../models/nodes/declarations/typescript-export-declaration.node.js";
import type { TypeScriptFunctionDeclarationNode } from "../models/nodes/declarations/typescript-function-declaration.node.js";
import type { TypeScriptImportDeclarationNode } from "../models/nodes/declarations/typescript-import-declaration.node.js";
import type { TypeScriptImportEqualsDeclarationNode } from "../models/nodes/declarations/typescript-import-equals-declaration.node.js";
import type { TypeScriptInterfaceDeclarationNode } from "../models/nodes/declarations/typescript-interface-declaration.node.js";
import type { TypeScriptModuleDeclarationNode } from "../models/nodes/declarations/typescript-module-declaration.node.js";
import type { TypeScriptNamespaceExportDeclarationNode } from "../models/nodes/declarations/typescript-namespace-export-declaration.node.js";
import type { TypeScriptParameterListNode } from "../models/nodes/declarations/typescript-parameter-list.node.js";
import type { TypeScriptTypeAliasDeclarationNode } from "../models/nodes/declarations/typescript-type-alias-declaration.node.js";
import type { TypeScriptDotNode } from "../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../models/nodes/delimiters/typescript-open-brace.node.js";
import type { TypeScriptOpenBracketNode } from "../models/nodes/delimiters/typescript-open-bracket.node.js";
import type { TypeScriptOpenParenthesisNode } from "../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptSemicolonNode } from "../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptArrayLiteralExpressionNode } from "../models/nodes/expressions/typescript-array-literal-expression.node.js";
import type { TypeScriptArrowFunctionNode } from "../models/nodes/expressions/typescript-arrow-function.node.js";
import type { TypeScriptAwaitExpressionNode } from "../models/nodes/expressions/typescript-await-expression.node.js";
import type { TypeScriptCallExpressionNode } from "../models/nodes/expressions/typescript-call-expression.node.js";
import type { TypeScriptClassExpressionNode } from "../models/nodes/expressions/typescript-class-expression.node.js";
import type { TypeScriptDeleteExpressionNode } from "../models/nodes/expressions/typescript-delete-expression.node.js";
import type { TypeScriptElementAccessExpressionNode } from "../models/nodes/expressions/typescript-element-access-expression.node.js";
import type { TypeScriptFunctionExpressionNode } from "../models/nodes/expressions/typescript-function-expression.node.js";
import type { TypeScriptNonNullExpressionNode } from "../models/nodes/expressions/typescript-non-null-expression.node.js";
import type { TypeScriptObjectLiteralExpressionNode } from "../models/nodes/expressions/typescript-object-literal-expression.node.js";
import type { TypeScriptParenthesizedExpressionNode } from "../models/nodes/expressions/typescript-parenthesized-expression.node.js";
import type { TypeScriptPrefixUnaryExpressionNode } from "../models/nodes/expressions/typescript-prefix-unary-expression.node.js";
import type { TypeScriptPropertyAccessExpressionNode } from "../models/nodes/expressions/typescript-property-access-expression.node.js";
import type { TypeScriptTaggedTemplateExpressionNode } from "../models/nodes/expressions/typescript-tagged-template-expression.node.js";
import type { TypeScriptTypeAssertionExpressionNode } from "../models/nodes/expressions/typescript-type-assertion-expression.node.js";
import type { TypeScriptTypeOfExpressionNode } from "../models/nodes/expressions/typescript-type-of-expression.node.js";
import type { TypeScriptVoidExpressionNode } from "../models/nodes/expressions/typescript-void-expression.node.js";
import type { TypeScriptAsKeywordNode } from "../models/nodes/keywords/typescript-as-keyword.node.js";
import type { TypeScriptAsyncKeywordNode } from "../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptAwaitKeywordNode } from "../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptBreakKeywordNode } from "../models/nodes/keywords/typescript-break-keyword.node.js";
import type { TypeScriptCaseKeywordNode } from "../models/nodes/keywords/typescript-case-keyword.node.js";
import type { TypeScriptClassKeywordNode } from "../models/nodes/keywords/typescript-class-keyword.node.js";
import type { TypeScriptConstKeywordNode } from "../models/nodes/keywords/typescript-const-keyword.node.js";
import type { TypeScriptContinueKeywordNode } from "../models/nodes/keywords/typescript-continue-keyword.node.js";
import type { TypeScriptDebuggerKeywordNode } from "../models/nodes/keywords/typescript-debugger-keyword.node.js";
import type { TypeScriptDefaultKeywordNode } from "../models/nodes/keywords/typescript-default-keyword.node.js";
import type { TypeScriptDeleteKeywordNode } from "../models/nodes/keywords/typescript-delete-keyword.node.js";
import type { TypeScriptDoKeywordNode } from "../models/nodes/keywords/typescript-do-keyword.node.js";
import type { TypeScriptEnumKeywordNode } from "../models/nodes/keywords/typescript-enum-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptForKeywordNode } from "../models/nodes/keywords/typescript-for-keyword.node.js";
import type { TypeScriptGlobalKeywordNode } from "../models/nodes/keywords/typescript-global-keyword.node.js";
import type { TypeScriptIfKeywordNode } from "../models/nodes/keywords/typescript-if-keyword.node.js";
import type { TypeScriptImportKeywordNode } from "../models/nodes/keywords/typescript-import-keyword.node.js";
import type { TypeScriptInterfaceKeywordNode } from "../models/nodes/keywords/typescript-interface-keyword.node.js";
import type { TypeScriptLetKeywordNode } from "../models/nodes/keywords/typescript-let-keyword.node.js";
import type { TypeScriptModuleKeywordNode } from "../models/nodes/keywords/typescript-module-keyword.node.js";
import type { TypeScriptNamespaceKeywordNode } from "../models/nodes/keywords/typescript-namespace-keyword.node.js";
import type { TypeScriptNewKeywordNode } from "../models/nodes/keywords/typescript-new-keyword.node.js";
import type { TypeScriptReturnKeywordNode } from "../models/nodes/keywords/typescript-return-keyword.node.js";
import type { TypeScriptSuperKeywordNode } from "../models/nodes/keywords/typescript-super-keyword.node.js";
import type { TypeScriptSwitchKeywordNode } from "../models/nodes/keywords/typescript-switch-keyword.node.js";
import type { TypeScriptThrowKeywordNode } from "../models/nodes/keywords/typescript-throw-keyword.node.js";
import type { TypeScriptTryKeywordNode } from "../models/nodes/keywords/typescript-try-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../models/nodes/keywords/typescript-type-keyword.node.js";
import type { TypeScriptTypeOfKeywordNode } from "../models/nodes/keywords/typescript-type-of-keyword.node.js";
import type { TypeScriptUsingKeywordNode } from "../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptVarKeywordNode } from "../models/nodes/keywords/typescript-var-keyword.node.js";
import type { TypeScriptVoidKeywordNode } from "../models/nodes/keywords/typescript-void-keyword.node.js";
import type { TypeScriptWhileKeywordNode } from "../models/nodes/keywords/typescript-while-keyword.node.js";
import type { TypeScriptWithKeywordNode } from "../models/nodes/keywords/typescript-with-keyword.node.js";
import type { TypeScriptNoSubstitutionTemplateLiteralNode } from "../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import type { TypeScriptTemplateHeadNode } from "../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptEqualsNode } from "../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptExclamationNode } from "../models/nodes/operators/typescript-exclamation.node.js";
import type { TypeScriptLessThanNode } from "../models/nodes/operators/typescript-less-than.node.js";
import type { TypeScriptQuestionDotNode } from "../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptBlockNode } from "../models/nodes/statements/typescript-block.node.js";
import type { TypeScriptBreakStatementNode } from "../models/nodes/statements/typescript-break-statement.node.js";
import type { TypeScriptContinueStatementNode } from "../models/nodes/statements/typescript-continue-statement.node.js";
import type { TypeScriptDebuggerStatementNode } from "../models/nodes/statements/typescript-debugger-statement.node.js";
import type { TypeScriptDoStatementNode } from "../models/nodes/statements/typescript-do-statement.node.js";
import type { TypeScriptEmptyStatementNode } from "../models/nodes/statements/typescript-empty-statement.node.js";
import type { TypeScriptExpressionStatementNode } from "../models/nodes/statements/typescript-expression-statement.node.js";
import type { TypeScriptForInOrOfStatementNode } from "../models/nodes/statements/typescript-for-in-or-of-statement.node.js";
import type { TypeScriptForStatementNode } from "../models/nodes/statements/typescript-for-statement.node.js";
import type { TypeScriptIfStatementNode } from "../models/nodes/statements/typescript-if-statement.node.js";
import type { TypeScriptLabeledStatementNode } from "../models/nodes/statements/typescript-labeled-statement.node.js";
import type { TypeScriptReturnStatementNode } from "../models/nodes/statements/typescript-return-statement.node.js";
import type { TypeScriptSwitchStatementNode } from "../models/nodes/statements/typescript-switch-statement.node.js";
import type { TypeScriptThrowStatementNode } from "../models/nodes/statements/typescript-throw-statement.node.js";
import type { TypeScriptTryStatementNode } from "../models/nodes/statements/typescript-try-statement.node.js";
import type { TypeScriptVariableStatementNode } from "../models/nodes/statements/typescript-variable-statement.node.js";
import type { TypeScriptWhileStatementNode } from "../models/nodes/statements/typescript-while-statement.node.js";
import type { TypeScriptWithStatementNode } from "../models/nodes/statements/typescript-with-statement.node.js";
import type { TypeScriptTypeArgumentListNode } from "../models/nodes/types/typescript-type-argument-list.node.js";
import { TypeScriptNonTextFileMarkerNode } from "../models/nodes/typescript-non-text-file-marker.node.js";
import { TypeScriptUnknownNode } from "../models/nodes/typescript-unknown.node.js";
import type { TypeScriptNode } from "../models/nodes/typescript.node.js";
import { TypeScriptJumpTarget } from "../models/typescript-jump-target.js";
import type { TypeScriptParserContext } from "../models/typescript-parser-context.js";
import { TypeScriptReservedBindingName } from "../models/typescript-reserved-binding-name.js";
import { Resources } from "../resources.js";
import { KeywordSpellingSuggester } from "./keyword-spelling-suggester.js";
import type { TypeScriptLexer } from "./lexers/typescript.lexer.js";
import { ClassParser } from "./parsers/class.parser.js";
import { SwitchClauseParser } from "./parsers/clauses/switch-clause.parser.js";
import { DeclarationParser } from "./parsers/declarations/declaration.parser.js";
import { EnumDeclarationParser } from "./parsers/declarations/enum-declaration.parser.js";
import { ExportAssignmentParser } from "./parsers/declarations/export-assignment.parser.js";
import { ExportDeclarationParser } from "./parsers/declarations/export-declaration.parser.js";
import { ImportDeclarationParser } from "./parsers/declarations/import-declaration.parser.js";
import { InterfaceDeclarationParser } from "./parsers/declarations/interface-declaration.parser.js";
import { ModuleDeclarationParser } from "./parsers/declarations/module-declaration.parser.js";
import { NamespaceExportDeclarationParser } from "./parsers/declarations/namespace-export-declaration.parser.js";
import { TypeAliasDeclarationParser } from "./parsers/declarations/type-alias-declaration.parser.js";
import { ArrayLiteralExpressionParser } from "./parsers/expressions/array-literal-expression.parser.js";
import { ArrowFunctionParser } from "./parsers/expressions/arrow-function.parser.js";
import { AssignmentExpressionParser } from "./parsers/expressions/assignment-expression.parser.js";
import { BinaryExpressionParser } from "./parsers/expressions/binary-expression.parser.js";
import { CallExpressionParser } from "./parsers/expressions/call-expression.parser.js";
import { ElementAccessExpressionParser } from "./parsers/expressions/element-access-expression.parser.js";
import { ExpressionParser } from "./parsers/expressions/expression.parser.js";
import { LeftHandSideExpressionParser } from "./parsers/expressions/left-hand-side-expression.parser.js";
import { MemberExpressionParser } from "./parsers/expressions/member-expression.parser.js";
import { NewExpressionParser } from "./parsers/expressions/new-expression.parser.js";
import { ObjectLiteralExpressionParser } from "./parsers/expressions/object-literal-expression.parser.js";
import { OptionalChainExpressionParser } from "./parsers/expressions/optional-chain-expression.parser.js";
import { ParenthesizedExpressionParser } from "./parsers/expressions/parenthesized-expression.parser.js";
import { PropertyAccessExpressionParser } from "./parsers/expressions/property-access-expression.parser.js";
import { TaggedTemplateExpressionParser } from "./parsers/expressions/tagged-template-expression.parser.js";
import { TemplateExpressionParser } from "./parsers/expressions/template-expression.parser.js";
import { UnaryExpressionParser } from "./parsers/expressions/unary-expression.parser.js";
import { FunctionParser } from "./parsers/function.parser.js";
import { PropertyNameParser } from "./parsers/names/property-name.parser.js";
import { SourceParser } from "./parsers/source.parser.js";
import { BlockParser } from "./parsers/statements/block.parser.js";
import { DebuggerStatementParser } from "./parsers/statements/debugger-statement.parser.js";
import { DoStatementParser } from "./parsers/statements/do-statement.parser.js";
import { EmptyStatementParser } from "./parsers/statements/empty-statement.parser.js";
import { ExpressionOrLabeledStatementParser } from "./parsers/statements/expression-or-labeled-statement.parser.js";
import { ForStatementParser } from "./parsers/statements/for-statement.parser.js";
import { IfStatementParser } from "./parsers/statements/if-statement.parser.js";
import { JumpStatementParser } from "./parsers/statements/jump-statement.parser.js";
import { ReturnStatementParser } from "./parsers/statements/return-statement.parser.js";
import { StatementParser } from "./parsers/statements/statement.parser.js";
import { SwitchStatementParser } from "./parsers/statements/switch-statement.parser.js";
import { ThrowStatementParser } from "./parsers/statements/throw-statement.parser.js";
import { TryStatementParser } from "./parsers/statements/try-statement.parser.js";
import { VariableStatementParser } from "./parsers/statements/variable-statement.parser.js";
import { WhileStatementParser } from "./parsers/statements/while-statement.parser.js";
import { WithStatementParser } from "./parsers/statements/with-statement.parser.js";
import { TypeArgumentListParser } from "./parsers/types/type-argument-list.parser.js";
import { TypeParser } from "./parsers/types/type.parser.js";

export class TypeScriptSyntaxParser extends Parser<TypeScriptNode, TypeScriptParserContext> {
  private readonly keywordSpellingSuggester: KeywordSpellingSuggester = new KeywordSpellingSuggester();
  private readonly switchClauseParser: SwitchClauseParser = new SwitchClauseParser(this);
  private readonly switchStatementParser: SwitchStatementParser = new SwitchStatementParser(this);
  private readonly tryStatementParser: TryStatementParser = new TryStatementParser(this);
  private readonly withStatementParser: WithStatementParser = new WithStatementParser(this);
  private readonly arrayLiteralExpressionParser: ArrayLiteralExpressionParser = new ArrayLiteralExpressionParser(this);
  private readonly classParser: ClassParser = new ClassParser(this);
  private readonly declarationParser: DeclarationParser = new DeclarationParser(this);
  private readonly moduleDeclarationParser: ModuleDeclarationParser = new ModuleDeclarationParser(this);
  private readonly importDeclarationParser: ImportDeclarationParser = new ImportDeclarationParser(this);
  private readonly exportDeclarationParser: ExportDeclarationParser = new ExportDeclarationParser(this);
  private readonly exportAssignmentParser: ExportAssignmentParser = new ExportAssignmentParser(this);
  private readonly namespaceExportDeclarationParser: NamespaceExportDeclarationParser = new NamespaceExportDeclarationParser(this);
  private readonly interfaceDeclarationParser: InterfaceDeclarationParser = new InterfaceDeclarationParser(this);
  private readonly enumDeclarationParser: EnumDeclarationParser = new EnumDeclarationParser(this);
  private readonly functionParser: FunctionParser = new FunctionParser(this);
  private readonly objectLiteralExpressionParser: ObjectLiteralExpressionParser = new ObjectLiteralExpressionParser(this);
  private readonly templateExpressionParser: TemplateExpressionParser = new TemplateExpressionParser(this);
  private readonly typeArgumentListParser: TypeArgumentListParser = new TypeArgumentListParser(this);
  private readonly typeParser: TypeParser = new TypeParser(this);
  private readonly arrowFunctionParser: ArrowFunctionParser = new ArrowFunctionParser(this);
  private readonly parenthesizedExpressionParser: ParenthesizedExpressionParser = new ParenthesizedExpressionParser(this);
  private readonly assignmentExpressionParser: AssignmentExpressionParser = new AssignmentExpressionParser(this);
  private readonly expressionParser: ExpressionParser = new ExpressionParser(this, this.assignmentExpressionParser);
  private readonly statementParser: StatementParser = new StatementParser(this);
  private readonly blockParser: BlockParser = new BlockParser(this);
  private readonly emptyStatementParser: EmptyStatementParser = new EmptyStatementParser(this);
  private readonly jumpStatementParser: JumpStatementParser = new JumpStatementParser(this);
  private readonly debuggerStatementParser: DebuggerStatementParser = new DebuggerStatementParser(this);
  private readonly doStatementParser: DoStatementParser = new DoStatementParser(this);
  private readonly ifStatementParser: IfStatementParser = new IfStatementParser(this);
  private readonly forStatementParser: ForStatementParser = new ForStatementParser(this);
  private readonly returnStatementParser: ReturnStatementParser = new ReturnStatementParser(this);
  private readonly throwStatementParser: ThrowStatementParser = new ThrowStatementParser(this);
  private readonly whileStatementParser: WhileStatementParser = new WhileStatementParser(this);
  private readonly typeAliasDeclarationParser: TypeAliasDeclarationParser = new TypeAliasDeclarationParser(this);
  private readonly variableStatementParser: VariableStatementParser = new VariableStatementParser(this);
  private readonly expressionOrLabeledStatementParser: ExpressionOrLabeledStatementParser = new ExpressionOrLabeledStatementParser(this);
  private readonly unaryExpressionParser: UnaryExpressionParser = new UnaryExpressionParser(this);
  private readonly leftHandSideExpressionParser: LeftHandSideExpressionParser = new LeftHandSideExpressionParser(this);
  private readonly binaryExpressionParser: BinaryExpressionParser = new BinaryExpressionParser(this);
  private readonly propertyNameParser: PropertyNameParser = new PropertyNameParser(this);
  private readonly propertyAccessExpressionParser: PropertyAccessExpressionParser = new PropertyAccessExpressionParser(this, this.propertyNameParser);
  private readonly elementAccessExpressionParser: ElementAccessExpressionParser = new ElementAccessExpressionParser(this);
  private readonly callExpressionParser: CallExpressionParser = new CallExpressionParser(this);
  private readonly taggedTemplateExpressionParser: TaggedTemplateExpressionParser = new TaggedTemplateExpressionParser(this);
  private readonly memberExpressionParser: MemberExpressionParser = new MemberExpressionParser(this, this.propertyNameParser);
  private readonly newExpressionParser: NewExpressionParser = new NewExpressionParser(this, this.propertyNameParser);
  private readonly optionalChainExpressionParser: OptionalChainExpressionParser = new OptionalChainExpressionParser(this, this.propertyAccessExpressionParser,
    this.callExpressionParser, this.taggedTemplateExpressionParser);
  private readonly sourceParser: SourceParser;

  public readonly typescriptLexer: TypeScriptLexer;

  public constructor(context: TypeScriptParserContext, lexer: TypeScriptLexer) {
    const startOffset = lexer.reader.currentOffset;
    super(context, lexer);
    this.typescriptLexer = lexer;
    this.sourceParser = new SourceParser(this, startOffset, this.currentNode.leadingTrivia);
  }

  public parseExpression(): Node {
    return this.expressionParser.parse();
  }

  public parseExpressionAllowingIn(): Node {
    return this.expressionParser.parseAllowingIn();
  }

  public override advance(): void {
    const node = this.currentNode;
    if (node.hasTypeScriptKeywordEscape())
      this.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1260, node.span);

    this.advanceLexer();
  }

  private advanceLexer(): void {
    this.typescriptLexer.precedingNode = this.currentNode;
    super.advance();
  }

  public reportMissingSemicolonAfterName(nameNode: ValueNode): void {
    const collector = this.context.diagnosticCollector;
    const text = nameNode.value;
    switch (text) {
      case Resources.let:
      case Resources.var:
        collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1440, nameNode.span);
        return;
      case Resources.interface:
        this.reportInvalidName(text, TypeScriptDiagnosticTemplates.TS2427, TypeScriptDiagnosticTemplates.TS1438, t => t instanceof TypeScriptOpenBraceNode);
        return;
      case Resources.is:
        collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1228,
          this.typescriptLexer.reader.createSpan(nameNode.span.startOffset, this.currentNode.span.startOffset - nameNode.span.startOffset));
        return;
      case Resources.type:
        this.reportInvalidName(text, TypeScriptDiagnosticTemplates.TS2457, TypeScriptDiagnosticTemplates.TS1439, t => t instanceof TypeScriptEqualsNode);
        return;
    }

    const suggestion = this.keywordSpellingSuggester.suggest(text);
    if (!Object.isUndefined(suggestion))
      collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1435, nameNode.span, [suggestion]);
    else if (!(this.currentNode instanceof TypeScriptUnknownNode) || this.currentNode instanceof TypeScriptNonTextFileMarkerNode)
      collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1434, nameNode.span);
  }

  private reportInvalidName(nameText: string, nameTemplate: DiagnosticTemplate, blankTemplate: DiagnosticTemplate, isBlank: (node: Node) => boolean): void {
    const node = this.currentNode;
    if (isBlank(node))
      this.context.diagnosticCollector.addTypeScriptParseDiagnostic(blankTemplate, node.span);
    else
      this.context.diagnosticCollector.addTypeScriptParseDiagnostic(nameTemplate, node.span, [node.getTypeScriptTokenValue() ?? nameText]);
  }

  public consumeName(): Node {
    const node = this.currentNode;
    if (node instanceof TypeScriptAwaitKeywordNode && !this.context.isAwaitContext)
      this.context.records.awaitNameCount++;
    this.advanceLexer();
    this.readName(node);
    return node;
  }

  public consumeIdentifierName(): Node {
    const node = this.currentNode;
    if (node instanceof TypeScriptAwaitKeywordNode)
      this.context.records.awaitNameCount++;
    this.advanceLexer();
    node.validateTypeScriptIdentifierName(this.context);
    return node;
  }

  public consumeBindingName(): Node {
    const node = this.currentNode;
    this.advanceLexer();
    this.readName(node);
    return node;
  }

  public readNameAsBinding(nameNode: Node): void {
    if (!(nameNode instanceof TypeScriptAwaitKeywordNode))
      return;

    this.context.records.awaitNameCount--;
    this.context.records.readReservedNameAsBinding(nameNode);
  }

  public reportWrittenAwaits(writtenAwaitCount: number, bodyNode: Node | undefined, containerNode: Node,
    isConstructor: boolean = false, isAsync: boolean = false): void {
    const context = this.context;
    if (Object.isUndefined(bodyNode)) {
      context.records.writtenAwaits.length = writtenAwaitCount;
      return;
    }

    for (let index = writtenAwaitCount; index < context.records.writtenAwaits.length; index++) {
      const writtenAwait = context.records.writtenAwaits[index]!;
      const template = writtenAwait.isForAwait ? TypeScriptDiagnosticTemplates.TS1103 : TypeScriptDiagnosticTemplates.TS1308;
      if (isConstructor || isAsync)
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, writtenAwait.keywordNode.span);
      else
        context.diagnosticCollector.addTypeScriptRelatedGrammarDiagnostic(context.source, template, writtenAwait.keywordNode.span,
          TypeScriptDiagnosticTemplates.TS1356, containerNode.getTypeScriptDeclarationNameSpan(context));
    }
    context.records.writtenAwaits.length = writtenAwaitCount;
  }

  public readName(nameNode: Node): void {
    const reservation = nameNode.getTypeScriptNameReservation();
    if (reservation === TypeScriptNameReservation.None || this.context.isAmbient)
      return;

    this.context.records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, reservation, this.context.hasEnclosingClass,
      this.context.isAwaitContext, this.context.isSourceTopLevel));
  }

  public readEvalOrArgumentsName(nameNode: Node): void {
    if (nameNode.isTypeScriptEvalOrArgumentsName())
      this.context.records.recordReservedBindingName(new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.EvalOrArguments,
        this.context.hasEnclosingClass, this.context.isAwaitContext, this.context.isSourceTopLevel));
  }

  public readAmbientStatement(statementNode: Node): void {
    const context = this.context;
    if (!context.isAmbient || context.hasReportedAmbientStatement || statementNode.isTypeScriptDeclarationStatement())
      return;

    context.hasReportedAmbientStatement = true;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1036, statementNode.getTypeScriptFirstTokenSpan());
  }

  public parseExpressionWithoutIn(): Node {
    return this.expressionParser.parseWithoutIn();
  }

  public parseAssignmentExpression(): Node {
    return this.assignmentExpressionParser.parse();
  }

  public parseAssignmentExpressionOrParameter(): Node {
    return this.assignmentExpressionParser.parseExpressionOrParameter();
  }

  public parseAssignmentExpressionAllowingIn(): Node {
    return this.assignmentExpressionParser.parseAllowingIn();
  }

  public parseLeftHandSideExpression(expressionNode?: Node): Node {
    return this.leftHandSideExpressionParser.parse(expressionNode);
  }

  public parseSuperExpression(keywordNode: TypeScriptSuperKeywordNode): Node {
    return this.memberExpressionParser.parseSuper(keywordNode);
  }

  public parseMemberExpression(): Node {
    return this.memberExpressionParser.parse();
  }

  public parseMemberExpressionRest(expressionNode: Node): Node {
    return this.memberExpressionParser.parseRest(expressionNode);
  }

  public parseBinaryExpression(leftNode: Node): Node {
    return this.binaryExpressionParser.parse(leftNode);
  }

  public parseBinaryOperator(operatorNode: Node, leftNode: Node, minimumPrecedence: number): Node | undefined {
    return this.binaryExpressionParser.parseOperator(operatorNode, leftNode, minimumPrecedence);
  }

  public parsePropertyAccessExpression(expressionNode: Node, accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined): TypeScriptPropertyAccessExpressionNode {
    return this.propertyAccessExpressionParser.parse(expressionNode, accessNode);
  }

  public parseElementAccessExpression(expressionNode: Node, openBracketNode: TypeScriptOpenBracketNode, questionDotNode?: TypeScriptQuestionDotNode): TypeScriptElementAccessExpressionNode {
    return this.elementAccessExpressionParser.parse(expressionNode, openBracketNode, questionDotNode);
  }

  public parseCallExpression(
    expressionNode: Node,
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode): TypeScriptCallExpressionNode {
    return this.callExpressionParser.parse(expressionNode, openParenthesisNode, questionDotNode, typeArgumentListNode);
  }

  public parseTaggedTemplateExpression(
    expressionNode: Node,
    templateStartNode: TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode): TypeScriptTaggedTemplateExpressionNode {
    return this.taggedTemplateExpressionParser.parse(expressionNode, templateStartNode, questionDotNode, typeArgumentListNode);
  }

  public parseOptionalChainExpression(expressionNode: Node, questionDotNode: TypeScriptQuestionDotNode): Node {
    return this.optionalChainExpressionParser.parse(expressionNode, questionDotNode);
  }

  public parseOptionalTypeArgumentSuffix(expressionNode: Node, questionDotNode: TypeScriptQuestionDotNode): Node {
    return this.optionalChainExpressionParser.parseTypeArgumentSuffix(expressionNode, questionDotNode);
  }

  public parseNewExpression(newKeywordNode: TypeScriptNewKeywordNode): Node {
    return this.newExpressionParser.parse(newKeywordNode);
  }

  public parseImportExpression(importKeywordNode: TypeScriptImportKeywordNode): Node {
    return this.memberExpressionParser.parseImport(importKeywordNode);
  }

  public parseNonNullExpression(expressionNode: Node, exclamationNode: TypeScriptExclamationNode): TypeScriptNonNullExpressionNode {
    return this.leftHandSideExpressionParser.parseNonNullExpression(expressionNode, exclamationNode);
  }

  public tryParseInstantiationExpression(expressionNode: Node): Node | undefined {
    return this.leftHandSideExpressionParser.tryParseInstantiationExpression(expressionNode);
  }

  public parseUnaryExpression(operandNode?: Node): Node {
    return this.unaryExpressionParser.parse(operandNode);
  }

  public parsePostfixUnaryExpression(): Node {
    return this.unaryExpressionParser.parsePostfixUnaryExpression();
  }

  public parsePrefixUnaryExpression(operatorNode: Node): TypeScriptPrefixUnaryExpressionNode {
    return this.unaryExpressionParser.parsePrefixUnaryExpression(operatorNode);
  }

  public parseDeleteExpression(deleteKeywordNode: TypeScriptDeleteKeywordNode): TypeScriptDeleteExpressionNode {
    return this.unaryExpressionParser.parseDeleteExpression(deleteKeywordNode);
  }

  public parseTypeOfExpression(typeOfKeywordNode: TypeScriptTypeOfKeywordNode): TypeScriptTypeOfExpressionNode {
    return this.unaryExpressionParser.parseTypeOfExpression(typeOfKeywordNode);
  }

  public parseVoidExpression(voidKeywordNode: TypeScriptVoidKeywordNode): TypeScriptVoidExpressionNode {
    return this.unaryExpressionParser.parseVoidExpression(voidKeywordNode);
  }

  public parseAwaitExpression(awaitKeywordNode: TypeScriptAwaitKeywordNode): TypeScriptAwaitExpressionNode {
    return this.unaryExpressionParser.parseAwaitExpression(awaitKeywordNode);
  }

  public parseTypeAssertionExpression(lessThanNode: TypeScriptLessThanNode): TypeScriptTypeAssertionExpressionNode {
    return this.unaryExpressionParser.parseTypeAssertionExpression(lessThanNode);
  }

  public parsePrimaryExpression(): Node {
    return this.currentNode.parseTypeScriptPrimaryExpression(this);
  }

  public parseArrayLiteralExpression(openBracketNode: TypeScriptOpenBracketNode): TypeScriptArrayLiteralExpressionNode {
    return this.arrayLiteralExpressionParser.parse(openBracketNode);
  }

  public parseClassExpression(classKeywordNode: TypeScriptClassKeywordNode): TypeScriptClassExpressionNode {
    return this.classParser.parseExpression(classKeywordNode);
  }

  public parseDecoratedClassExpression(): Node {
    return this.classParser.parseDecoratedExpression();
  }

  public parseFunctionExpression(): TypeScriptFunctionExpressionNode {
    return this.functionParser.parseExpression();
  }

  public parseClassDeclaration(classKeywordNode: TypeScriptClassKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptClassDeclarationNode {
    return this.classParser.parseDeclaration(classKeywordNode, modifierNodes);
  }

  public parseFunctionDeclaration(modifierNodes: readonly Node[] = []): TypeScriptFunctionDeclarationNode {
    return this.functionParser.parseDeclaration(modifierNodes);
  }

  public parseObjectLiteralExpression(openBraceNode: TypeScriptOpenBraceNode): TypeScriptObjectLiteralExpressionNode {
    return this.objectLiteralExpressionParser.parse(openBraceNode);
  }

  public parseTemplateExpression(templateStartNode: TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode): Node {
    return this.templateExpressionParser.parse(templateStartNode, false);
  }

  public parseBlock(openBraceNode: TypeScriptOpenBraceNode): TypeScriptBlockNode {
    return this.blockParser.parse(openBraceNode);
  }

  public parseRequiredBlock(): TypeScriptBlockNode {
    return this.blockParser.parseRequired();
  }

  public parseSwitchStatement(keywordNode: TypeScriptSwitchKeywordNode): TypeScriptSwitchStatementNode {
    return this.switchStatementParser.parse(keywordNode);
  }

  public parseCaseClause(keywordNode: TypeScriptCaseKeywordNode): TypeScriptCaseClauseNode {
    return this.switchClauseParser.parseCase(keywordNode);
  }

  public parseDefaultClause(keywordNode: TypeScriptDefaultKeywordNode): TypeScriptDefaultClauseNode {
    return this.switchClauseParser.parseDefault(keywordNode);
  }

  public parseTryStatement(keywordNode?: TypeScriptTryKeywordNode): TypeScriptTryStatementNode {
    return this.tryStatementParser.parse(keywordNode);
  }

  public parseWithStatement(keywordNode: TypeScriptWithKeywordNode): TypeScriptWithStatementNode {
    return this.withStatementParser.parse(keywordNode);
  }

  public parseEmptyStatement(semicolonNode: TypeScriptSemicolonNode): TypeScriptEmptyStatementNode {
    return this.emptyStatementParser.parse(semicolonNode);
  }

  public parseBreakStatement(breakKeywordNode: TypeScriptBreakKeywordNode): TypeScriptBreakStatementNode {
    return this.jumpStatementParser.parseBreak(breakKeywordNode);
  }

  public parseContinueStatement(continueKeywordNode: TypeScriptContinueKeywordNode): TypeScriptContinueStatementNode {
    return this.jumpStatementParser.parseContinue(continueKeywordNode);
  }

  public parseDebuggerStatement(debuggerKeywordNode: TypeScriptDebuggerKeywordNode): TypeScriptDebuggerStatementNode {
    return this.debuggerStatementParser.parse(debuggerKeywordNode);
  }

  public parseDoStatement(doKeywordNode: TypeScriptDoKeywordNode): TypeScriptDoStatementNode {
    return this.doStatementParser.parse(doKeywordNode);
  }

  public parseIfStatement(ifKeywordNode: TypeScriptIfKeywordNode): TypeScriptIfStatementNode {
    return this.ifStatementParser.parse(ifKeywordNode);
  }

  public parseForStatement(forKeywordNode: TypeScriptForKeywordNode): TypeScriptForStatementNode | TypeScriptForInOrOfStatementNode {
    return this.forStatementParser.parse(forKeywordNode);
  }

  public parseReturnStatement(returnKeywordNode: TypeScriptReturnKeywordNode): TypeScriptReturnStatementNode {
    return this.returnStatementParser.parse(returnKeywordNode);
  }

  public parseThrowStatement(throwKeywordNode: TypeScriptThrowKeywordNode): TypeScriptThrowStatementNode {
    return this.throwStatementParser.parse(throwKeywordNode);
  }

  public parseWhileStatement(whileKeywordNode: TypeScriptWhileKeywordNode): TypeScriptWhileStatementNode {
    return this.whileStatementParser.parse(whileKeywordNode);
  }

  public parseTypeAliasDeclaration(typeKeywordNode: TypeScriptTypeKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptTypeAliasDeclarationNode {
    return this.typeAliasDeclarationParser.parse(typeKeywordNode, modifierNodes);
  }

  public parseVariableStatement(keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    modifierNodes: readonly Node[] = [], awaitKeywordNode?: TypeScriptAwaitKeywordNode): TypeScriptVariableStatementNode {
    return this.variableStatementParser.parse(keywordNode, modifierNodes, awaitKeywordNode);
  }

  public parseExpressionOrLabeledStatement(): TypeScriptExpressionStatementNode | TypeScriptLabeledStatementNode {
    return this.expressionOrLabeledStatementParser.parse();
  }

  public parseInterfaceDeclaration(interfaceKeywordNode: TypeScriptInterfaceKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptInterfaceDeclarationNode {
    return this.interfaceDeclarationParser.parse(interfaceKeywordNode, modifierNodes);
  }

  public parseEnumDeclaration(enumKeywordNode: TypeScriptEnumKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptEnumDeclarationNode {
    return this.enumDeclarationParser.parse(enumKeywordNode, modifierNodes);
  }

  public isDeclarationStart(): boolean {
    return this.declarationParser.isStart();
  }

  public parseDeclaration(): Node {
    return this.declarationParser.parse();
  }

  public parseImportDeclaration(keywordNode: TypeScriptImportKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptImportDeclarationNode | TypeScriptImportEqualsDeclarationNode {
    return this.importDeclarationParser.parse(keywordNode, modifierNodes);
  }

  public parseExportDeclaration(keywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptExportDeclarationNode {
    return this.exportDeclarationParser.parse(keywordNode, modifierNodes);
  }

  public parseExportAssignment(keywordNode: TypeScriptExportKeywordNode, assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode, modifierNodes: readonly Node[] = []): TypeScriptExportAssignmentNode {
    return this.exportAssignmentParser.parse(keywordNode, assignmentTokenNode, modifierNodes);
  }

  public parseNamespaceExportDeclaration(keywordNode: TypeScriptExportKeywordNode, asKeywordNode: TypeScriptAsKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptNamespaceExportDeclarationNode {
    return this.namespaceExportDeclarationParser.parse(keywordNode, asKeywordNode, modifierNodes);
  }

  public isNamedModuleDeclarationStart(): boolean {
    return this.moduleDeclarationParser.isNamedStart();
  }

  public parseModuleDeclaration(keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode,
    modifierNodes: readonly Node[] = []): TypeScriptModuleDeclarationNode {
    return this.moduleDeclarationParser.parse(keywordNode, modifierNodes);
  }

  public reportInvalidModuleName(nameNode: ValueNode): void {
    this.moduleDeclarationParser.reportInvalidName(nameNode);
  }

  public parseStatement(): Node {
    return this.statementParser.parse();
  }

  public parseSubstatement(): Node {
    const context = this.context;
    const previousSubstatement = context.isSubstatement;
    const previousCaseClause = context.isCaseClause;
    context.isSubstatement = true;
    context.isCaseClause = false;
    try {
      return this.statementParser.parse();
    }
    finally {
      context.isSubstatement = previousSubstatement;
      context.isCaseClause = previousCaseClause;
    }
  }

  public parseIterationBody(): Node {
    this.context.jumpTargets.push(TypeScriptJumpTarget.ofIteration);
    try {
      return this.parseSubstatement();
    }
    finally {
      this.context.jumpTargets.pop();
    }
  }

  public tryParseArrowFunction(): TypeScriptArrowFunctionNode | undefined {
    return this.arrowFunctionParser.tryParse();
  }

  public recognizeArrowHead(): TypeScriptArrowHeadKind {
    return this.arrowFunctionParser.recognizeHeadKind();
  }

  public parseArrowFunctionDefinite(): TypeScriptArrowFunctionNode | undefined {
    return this.arrowFunctionParser.parseDefinite();
  }

  public parseArrowFunctionWithParameters(
    parameterListNode: TypeScriptParameterListNode,
    parameterAwaitCount: number,
    asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined,
    hasHeadDiagnostics: boolean): TypeScriptArrowFunctionNode | undefined {
    return this.arrowFunctionParser.parseWithParameters(parameterListNode, parameterAwaitCount, asyncKeywordNode, hasHeadDiagnostics);
  }

  public tryParseParenthesizedExpressionOrArrowFunction(): Node | undefined {
    return this.parenthesizedExpressionParser.tryParseExpressionOrArrowFunction();
  }

  public parseArrowFunctionWithParameter(nameNode: Node): TypeScriptArrowFunctionNode {
    return this.arrowFunctionParser.parseWithParameter(nameNode);
  }

  public parseParenthesizedExpression(openParenthesisNode: TypeScriptOpenParenthesisNode): TypeScriptParenthesizedExpressionNode {
    return this.parenthesizedExpressionParser.parse(openParenthesisNode);
  }

  public parseTypeArgumentList(): TypeScriptTypeArgumentListNode | undefined {
    return this.typeArgumentListParser.parse();
  }

  public parseTypeReferenceArgumentList(): TypeScriptTypeArgumentListNode | undefined {
    return this.typeArgumentListParser.parseOfTypeReference();
  }

  public tryParseTypeArgumentExpressionSuffix(calleeNode?: Node): TypeScriptTypeArgumentListNode | undefined {
    return this.typeArgumentListParser.tryParseExpressionSuffix(calleeNode);
  }

  public parseType(): Node {
    return this.typeParser.parse();
  }

  public parseTypeWithoutConditional(): Node {
    return this.typeParser.parseTypeWithoutConditional();
  }

  public parseTypeOperand(): Node {
    return this.typeParser.parseTypeOperand();
  }

  public parseReturnType(allowsPredicate: boolean = true): Node {
    return this.typeParser.parseReturnType(allowsPredicate);
  }

  public reLexLessThan(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexLessThan(leadingTrivia));
  }

  public reLexGreaterThan(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexGreaterThan(leadingTrivia));
  }

  public parseRegularExpression(): Node {
    this.reLexRegularExpression();
    const regularExpressionNode = this.currentNode;
    this.advance();
    return regularExpressionNode;
  }

  public reLexRegularExpression(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexRegularExpression(leadingTrivia));
  }

  public reLexTemplateContinuation(isTaggedTemplate: boolean): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexTemplateContinuation(leadingTrivia, isTaggedTemplate));
  }

  public reLexUntaggedTemplate(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexUntaggedTemplate(leadingTrivia));
  }

  public reLexAsterisk(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexAsterisk(leadingTrivia));
  }

  public reLexQuestion(): void {
    const leadingTrivia = this.currentNode.leadingTrivia;
    super.reLexCurrentNode(() => this.typescriptLexer.reLexQuestion(leadingTrivia));
  }

  public hasPrecedingLineBreak(): boolean {
    return this.currentNode.leadingTrivia?.containsTypeScriptLineBreak() ?? false;
  }

  public parseStatementTerminator(expressionNode?: Node): TypeScriptSemicolonNode | undefined {
    return this.statementParser.parseTerminator(expressionNode);
  }

  public reportExpected(text: string): void {
    this.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, this.currentNode.span, [text]);
  }

  public canParseStatementTerminator(): boolean {
    return this.statementParser.canParseTerminator();
  }

  protected override parseRootNode(): TypeScriptNode {
    const rootNode = this.sourceParser.parse();
    this.context.clearRecognitionCaches();
    return rootNode;
  }

  public override lookAhead(action: () => boolean): boolean {
    const mark = this.context.records.mark();
    try {
      return super.lookAhead(action);
    }
    finally {
      this.context.records.release(mark);
    }
  }

  public override tryParse<TResult>(action: () => TResult | undefined): TResult | undefined {
    const mark = this.context.records.mark();
    let isCommitted = false;
    try {
      const result = super.tryParse(action);
      isCommitted = !Object.isUndefined(result);
      return result;
    }
    finally {
      if (!isCommitted)
        this.context.records.release(mark);
    }
  }
}
