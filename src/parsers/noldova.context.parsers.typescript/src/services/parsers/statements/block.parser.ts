/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class BlockParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(openBraceNode: TypeScriptOpenBraceNode, hasReportedAmbientStatement: boolean = false): TypeScriptBlockNode {
    const context = this.typescriptParser.context;
    const previousNested = context.isNestedStatement;
    const previousModuleBody = context.isModuleBody;
    const previousSubstatement = context.isSubstatement;
    const previousCaseClause = context.isCaseClause;
    context.isNestedStatement = true;
    context.isModuleBody = false;
    context.isSubstatement = false;
    context.isCaseClause = false;
    let blockNode: TypeScriptBlockNode;
    try {
      blockNode = this.parseBlock(openBraceNode, hasReportedAmbientStatement);
    }
    finally {
      context.isNestedStatement = previousNested;
      context.isModuleBody = previousModuleBody;
      context.isSubstatement = previousSubstatement;
      context.isCaseClause = previousCaseClause;
    }
    const node = this.typescriptParser.currentNode;
    if (node instanceof TypeScriptEqualsNode) {
      context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS2809, node.span);
      this.typescriptParser.advance();
    }
    return blockNode;
  }

  public parseModuleBody(openBraceNode: TypeScriptOpenBraceNode): TypeScriptBlockNode {
    const context = this.typescriptParser.context;
    const previousNested = context.isNestedStatement;
    const previousModuleBody = context.isModuleBody;
    const previousSubstatement = context.isSubstatement;
    const previousNewTargetScope = context.isNewTargetScope;
    context.isNestedStatement = false;
    context.isModuleBody = true;
    context.isSubstatement = false;
    context.isNewTargetScope = false;
    try {
      return this.parseBlock(openBraceNode);
    }
    finally {
      context.isNestedStatement = previousNested;
      context.isModuleBody = previousModuleBody;
      context.isSubstatement = previousSubstatement;
      context.isNewTargetScope = previousNewTargetScope;
    }
  }

  private parseBlock(openBraceNode: TypeScriptOpenBraceNode | undefined, hasReportedAmbientStatement: boolean = false): TypeScriptBlockNode {
    const context = this.typescriptParser.context;
    const previousReportedAmbientStatement = context.hasReportedAmbientStatement;
    context.hasReportedAmbientStatement = hasReportedAmbientStatement;
    context.enterList(TypeScriptListKind.BlockStatements);
    try {
      const startNode = openBraceNode ?? this.typescriptParser.currentNode;
      const startOffset = startNode.span.startOffset;
      if (Object.isUndefined(openBraceNode))
        this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(
          TypeScriptDiagnosticTemplates.TS1005, startNode.span, [Resources.openBrace]);
      else
        this.typescriptParser.advance();

      const statements: Node[] = [];
      while (!this.typescriptParser.isEndOfFile && !(this.typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        const node = this.typescriptParser.currentNode;
        if (node.isTypeScriptUnexpectedStatementToken(this.typescriptParser)) {
          node.reportTypeScriptUnexpectedStatementToken(this.typescriptParser, TypeScriptListKind.BlockStatements);
          if (context.isListBoundary(this.typescriptParser))
            break;
          this.typescriptParser.advance();
          continue;
        }

        const statementNode = this.typescriptParser.parseStatement();
        statements.push(statementNode);
        this.typescriptParser.readAmbientStatement(statementNode);
      }

      const closeBraceNode = this.typescriptParser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(closeBraceNode))
        context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(context.source, this.typescriptParser.currentNode.span,
          context.isModuleBody ? undefined : openBraceNode?.span, Resources.openBrace, Resources.closeBrace);

      const endOffset = closeBraceNode?.span.endOffset ?? this.typescriptParser.currentNode.getTypeScriptFullSpan().startOffset;
      const span = this.typescriptParser.typescriptLexer.reader.createSpan(startOffset, endOffset - startOffset);
      const trailingTrivia = Object.isUndefined(closeBraceNode) ? this.typescriptParser.currentNode.leadingTrivia : closeBraceNode.trailingTrivia;

      return new TypeScriptBlockNode(openBraceNode, statements, span, closeBraceNode, startNode.leadingTrivia, trailingTrivia);
    }
    finally {
      context.leaveList();
      context.hasReportedAmbientStatement = previousReportedAmbientStatement;
    }
  }

  public parseRequired(): TypeScriptBlockNode {
    const node = this.typescriptParser.currentNode;
    return node instanceof TypeScriptOpenBraceNode ? this.parse(node) : this.reportMissing();
  }

  public reportMissing(template: DiagnosticTemplate = TypeScriptDiagnosticTemplates.TS1005): TypeScriptBlockNode {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(template, node.span, [Resources.openBrace]);
    return new TypeScriptBlockNode(undefined, [], node.getTypeScriptMissingNodeSpan());
  }

  public parseFunctionBody(openBraceNode: TypeScriptOpenBraceNode | undefined, flags: TypeScriptContextFlags = TypeScriptContextFlags.None,
    isNewTargetScope: boolean = false): TypeScriptBlockNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    const previousFunctionScope = context.isFunctionScope;
    const previousNewTargetScope = context.isNewTargetScope;
    const previousClassStaticBlock = context.isClassStaticBlock;
    const previousJumpTargets = context.jumpTargets;
    const previousAwaitNameCount = context.records.awaitNameCount;
    context.contextFlags = flags | (previousFlags & TypeScriptContextFlags.DisallowIn);
    context.isFunctionScope = true;
    context.isNewTargetScope = isNewTargetScope;
    context.isClassStaticBlock = false;
    context.jumpTargets = [];
    try {
      if (context.isAmbient && !Object.isUndefined(openBraceNode)) {
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1183, openBraceNode.span);
        return this.parse(openBraceNode, true);
      }
      return Object.isUndefined(openBraceNode) ? this.parseBlock(undefined) : this.parse(openBraceNode);
    }
    finally {
      context.contextFlags = previousFlags;
      context.isFunctionScope = previousFunctionScope;
      context.isNewTargetScope = previousNewTargetScope;
      context.isClassStaticBlock = previousClassStaticBlock;
      context.jumpTargets = previousJumpTargets;
      context.records.awaitNameCount = previousAwaitNameCount;
    }
  }
}
