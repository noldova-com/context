/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../enums/typescript-list-kind.js";
import { TypeScriptNameReservation } from "../../enums/typescript-name-reservation.js";
import { TypeScriptRecursionLimitException } from "../../exceptions/typescript-recursion-limit.exception.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptParserDiagnosticTemplates } from "../../models/diagnostics/typescript-parser-diagnostic-templates.js";
import { TypeScriptUnknownNode } from "../../models/nodes/typescript-unknown.node.js";
import { TypeScriptNode } from "../../models/nodes/typescript.node.js";
import { TypeScriptParserContext } from "../../models/typescript-parser-context.js";
import { TypeScriptRegionSet } from "../../models/typescript-region-set.js";
import { TypeScriptReparsedRegion } from "../../models/typescript-reparsed-region.js";
import { Resources } from "../../resources.js";
import { TypeScriptLexer } from "../lexers/typescript.lexer.js";
import { TypeScriptSyntaxParser } from "../typescript-syntax.parser.js";
import { SourceDirectiveParser } from "./trivia/source-directive.parser.js";

export class SourceParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly startOffset: number;
  private readonly leadingTrivia: Node | undefined;
  private readonly directiveParser: SourceDirectiveParser;
  private hasReportedUnmodifiedDeclaration: boolean = false;

  public constructor(typescriptParser: TypeScriptSyntaxParser, startOffset: number, leadingTrivia: Node | undefined) {
    this.typescriptParser = typescriptParser;
    this.startOffset = startOffset;
    this.leadingTrivia = leadingTrivia;
    this.directiveParser = new SourceDirectiveParser(typescriptParser);
  }

  public parse(): TypeScriptNode {
    const context = this.typescriptParser.context;
    this.directiveParser.parse(this.leadingTrivia);
    const ranges: SourceSpan[] = [];
    const rootNode = this.parseStatements(ranges);
    const isModule = (!context.isDeclaration && (context.isEsModuleFile || context.isCommonJsFile)) || context.records.hasImportMeta
      || rootNode.children.some(t => t.isTypeScriptExternalModuleIndicator());
    if (context.isDeclaration || context.isAwaitContext || ranges.length === 0 || !isModule
      || context.diagnosticCollector.diagnostics.some(t => t.code === TypeScriptParserDiagnosticTemplates.CTX2000.code)) {
      this.reportRecords(isModule);
      return rootNode;
    }

    const originalDiagnostics = [...context.diagnosticCollector.diagnostics];
    const statements: Node[] = [];
    const regions: TypeScriptReparsedRegion[] = [];
    const replacedDiagnosticSpans: SourceSpan[] = [];
    let statementIndex = 0;
    let rangeIndex = 0;
    while (rangeIndex < ranges.length) {
      const range = ranges[rangeIndex]!;
      while (statementIndex < rootNode.children.length && rootNode.children[statementIndex]!.span.endOffset <= range.startOffset)
        statements.push(rootNode.children[statementIndex++]!);
      const region = this.reparseRegion(ranges, rangeIndex);
      regions.push(region);
      for (const statement of region.statements)
        statements.push(statement);
      while (statementIndex < rootNode.children.length && rootNode.children[statementIndex]!.span.startOffset < region.span.endOffset)
        statementIndex++;
      const followingStatement = rootNode.children[statementIndex];
      const followingOffset = followingStatement?.leadingTrivia?.span.startOffset ?? followingStatement?.span.startOffset ?? rootNode.span.endOffset;
      replacedDiagnosticSpans.push(new SourceSpan(range.startOffset, followingOffset - range.startOffset));
      do
        rangeIndex++;
      while (rangeIndex < ranges.length && ranges[rangeIndex]!.startOffset < region.span.endOffset);
    }
    while (statementIndex < rootNode.children.length)
      statements.push(rootNode.children[statementIndex++]!);
    const replacedDiagnosticRegions = new TypeScriptRegionSet(replacedDiagnosticSpans);
    context.diagnosticCollector.truncate(0);
    for (const diagnostic of originalDiagnostics)
      if (!replacedDiagnosticRegions.contains(diagnostic.location!.start))
        context.diagnosticCollector.add(diagnostic);
    for (const region of regions)
      for (const diagnostic of region.diagnostics)
        context.diagnosticCollector.add(diagnostic);
    context.records.replaceRegions(new TypeScriptRegionSet(regions.map(t => t.span)), regions.map(t => t.records));
    const isInterrupted = context.diagnosticCollector.diagnostics.some(t => t.code === TypeScriptParserDiagnosticTemplates.CTX2000.code);
    this.reportRecords(isModule);
    return new TypeScriptNode(statements, rootNode.span, rootNode.leadingTrivia, isInterrupted ? undefined : rootNode.trailingTrivia);
  }

  private reportWrittenGlobalExports(isModule: boolean): void {
    const context = this.typescriptParser.context;
    if (isModule && context.isDeclaration)
      return;

    const template = isModule ? TypeScriptDiagnosticTemplates.TS1315 : TypeScriptDiagnosticTemplates.TS1314;
    for (const globalExportNode of context.records.writtenGlobalExports)
      context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, template, globalExportNode.span);
  }

  private reportWrittenTypePredicates(): void {
    const context = this.typescriptParser.context;
    for (const predicateNode of context.records.writtenTypePredicates)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1228, predicateNode.span);
  }

  private reportMisplacedParameterProperties(): void {
    const context = this.typescriptParser.context;
    for (const parameterNode of context.records.misplacedParameterProperties)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2369, parameterNode.span);
  }

  private reportWrittenObjectLiterals(): void {
    const context = this.typescriptParser.context;
    const patternLiterals = new Set(context.records.patternLiterals);
    for (const literalNode of context.records.writtenObjectLiterals)
      if (!patternLiterals.has(literalNode))
        literalNode.validateTypeScriptGrammar(context);
  }

  private reportRecords(isModule: boolean): void {
    this.reportReservedBindingNames(isModule);
    this.reportWrittenAwaits(isModule);
    this.reportWrittenGlobalExports(isModule);
    this.reportWrittenTypePredicates();
    this.reportWrittenObjectLiterals();
    this.reportMisplacedParameterProperties();
  }

  private reportWrittenAwaits(isModule: boolean): void {
    const context = this.typescriptParser.context;
    for (const writtenAwait of context.records.writtenAwaits)
      if (!writtenAwait.isSourceTopLevel)
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
          writtenAwait.isForAwait ? TypeScriptDiagnosticTemplates.TS1103 : TypeScriptDiagnosticTemplates.TS1308, writtenAwait.keywordNode.span);
      else if (!isModule)
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
          writtenAwait.isForAwait ? TypeScriptDiagnosticTemplates.TS1431 : TypeScriptDiagnosticTemplates.TS1375, writtenAwait.keywordNode.span);
  }

  private reportReservedBindingNames(isModule: boolean): void {
    const context = this.typescriptParser.context;
    for (const reservedName of context.records.reservedBindingNames) {
      const text = context.source.getText(reservedName.nameNode.span);
      if (reservedName.reservation === TypeScriptNameReservation.Await) {
        if (isModule && reservedName.isSourceTopLevel)
          context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1262, reservedName.nameNode.span, [text]);
        else if (reservedName.isAwaitContext)
          context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1359, reservedName.nameNode.span, [text]);
        continue;
      }
      if (reservedName.reservation === TypeScriptNameReservation.EvalOrArguments) {
        const template = reservedName.hasEnclosingClass
          ? TypeScriptDiagnosticTemplates.TS1210
          : isModule ? TypeScriptDiagnosticTemplates.TS1215 : TypeScriptDiagnosticTemplates.TS1100;
        context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, template, reservedName.nameNode.span, [text]);
        continue;
      }

      const template = reservedName.hasEnclosingClass
        ? TypeScriptDiagnosticTemplates.TS1213
        : isModule ? TypeScriptDiagnosticTemplates.TS1214 : TypeScriptDiagnosticTemplates.TS1212;
      context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, template, reservedName.nameNode.span, [text]);
    }
  }

  private readUnmodifiedDeclaration(statementNode: Node): void {
    const context = this.typescriptParser.context;
    if (!context.isDeclaration || this.hasReportedUnmodifiedDeclaration || !statementNode.requiresTypeScriptDeclareModifier())
      return;

    this.hasReportedUnmodifiedDeclaration = true;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1046, statementNode.getTypeScriptFirstTokenSpan());
  }

  private parseStatements(ranges: SourceSpan[]): TypeScriptNode {
    const parser = this.typescriptParser;
    const context = parser.context;
    const statements: Node[] = [];
    let statementStartNode = parser.currentNode;
    let isInterrupted = false;
    context.enterList(TypeScriptListKind.SourceElements);
    try {
      while (!parser.isEndOfFile) {
        statementStartNode = parser.currentNode;
        if (statementStartNode.isTypeScriptUnexpectedStatementToken(parser)) {
          statementStartNode.reportTypeScriptUnexpectedStatementToken(parser, TypeScriptListKind.SourceElements);
          parser.advance();
          continue;
        }
        context.records.awaitNameCount = 0;
        const statement = parser.parseStatement();
        statements.push(statement);
        parser.readAmbientStatement(statement);
        this.readUnmodifiedDeclaration(statement);
        if (context.records.awaitNameCount > 0 && !context.isAwaitContext && !context.isDeclaration) {
          const startOffset = statement.leadingTrivia?.span.startOffset ?? statement.span.startOffset;
          const previous = ranges.at(-1);
          if (!Object.isUndefined(previous) && previous.endOffset === startOffset)
            ranges[ranges.length - 1] = new SourceSpan(previous.startOffset, statement.span.endOffset - previous.startOffset);
          else
            ranges.push(new SourceSpan(startOffset, statement.span.endOffset - startOffset));
        }
      }
    }
    catch (error) {
      if (!(error instanceof TypeScriptRecursionLimitException))
        throw error;
      this.recoverFromRecursionLimit(parser, statements, statementStartNode, error);
      isInterrupted = true;
    }
    finally {
      context.leaveList();
    }
    const endOfFileNode = parser.currentNode;
    const span = parser.typescriptLexer.reader.createSpan(this.startOffset, endOfFileNode.span.endOffset - this.startOffset);
    const trailingTrivia = isInterrupted || statements.length === 0 ? undefined : endOfFileNode.leadingTrivia;
    return new TypeScriptNode(statements, span, this.leadingTrivia, trailingTrivia);
  }

  private reparseRegion(ranges: readonly SourceSpan[], index: number): TypeScriptReparsedRegion {
    const originalContext = this.typescriptParser.context;
    const reader = this.typescriptParser.typescriptLexer.reader;
    const savedOffset = reader.currentOffset;
    const startOffset = ranges[index]!.startOffset;
    let endOffset = ranges[index]!.endOffset;
    const context = new TypeScriptParserContext(reader.source);
    context.contextFlags = originalContext.contextFlags | TypeScriptContextFlags.TopLevelAwait;
    const statements: Node[] = [];
    reader.seek(startOffset);
    const parser = new TypeScriptSyntaxParser(context, new TypeScriptLexer(reader, context.diagnosticCollector, context.records.commentDirectiveOffsets));
    let statementStartNode = parser.currentNode;
    try {
      while (!parser.isEndOfFile) {
        statementStartNode = parser.currentNode;
        const statement = parser.parseStatement();
        statements.push(statement);
        const nextOffset = parser.currentNode.leadingTrivia?.span.startOffset ?? parser.currentNode.span.startOffset;
        if (!parser.isEndOfFile && parser.currentNode.span.startOffset === statementStartNode.span.startOffset)
          parser.advance();
        if (nextOffset === endOffset)
          break;
        if (nextOffset > endOffset)
          endOffset = ranges[++index]?.endOffset ?? reader.endOffset;
      }
      if (parser.isEndOfFile)
        endOffset = reader.endOffset;
    }
    catch (error) {
      if (!(error instanceof TypeScriptRecursionLimitException))
        throw error;
      this.recoverFromRecursionLimit(parser, statements, statementStartNode, error);
      endOffset = reader.endOffset;
    }
    context.clearRecognitionCaches();
    reader.seek(savedOffset);
    return new TypeScriptReparsedRegion(statements, [...context.diagnosticCollector.diagnostics],
      reader.createSpan(startOffset, endOffset - startOffset), context.records);
  }

  private recoverFromRecursionLimit(parser: TypeScriptSyntaxParser, statements: Node[], startNode: Node, error: TypeScriptRecursionLimitException): void {
    const diagnostics = parser.context.diagnosticCollector;
    const count = diagnostics.diagnostics.length;
    while (!parser.isEndOfFile)
      parser.advance();
    diagnostics.truncate(count);
    diagnostics.add(TypeScriptParserDiagnosticTemplates.CTX2000, error.span, [Resources.maximumRecursionDepth]);
    const reader = parser.typescriptLexer.reader;
    const span = reader.createSpan(startNode.span.startOffset, parser.currentNode.span.endOffset - startNode.span.startOffset);
    statements.push(new TypeScriptUnknownNode(reader.source.getText(span), span, startNode.leadingTrivia));
  }
}
