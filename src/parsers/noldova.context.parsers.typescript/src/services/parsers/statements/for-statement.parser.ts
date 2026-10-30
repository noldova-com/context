/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptForKeywordNode } from "../../../models/nodes/keywords/typescript-for-keyword.node.js";
import { TypeScriptInKeywordNode } from "../../../models/nodes/keywords/typescript-in-keyword.node.js";
import { TypeScriptOfKeywordNode } from "../../../models/nodes/keywords/typescript-of-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptForInOrOfStatementNode } from "../../../models/nodes/statements/typescript-for-in-or-of-statement.node.js";
import { TypeScriptForInStatementNode } from "../../../models/nodes/statements/typescript-for-in-statement.node.js";
import { TypeScriptForOfStatementNode } from "../../../models/nodes/statements/typescript-for-of-statement.node.js";
import { TypeScriptForStatementNode } from "../../../models/nodes/statements/typescript-for-statement.node.js";
import { TypeScriptWrittenAwait } from "../../../models/typescript-written-await.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { VariableDeclarationListParser } from "../declarations/variable-declaration-list.parser.js";

export class ForStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly variableDeclarationListParser: VariableDeclarationListParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.variableDeclarationListParser = new VariableDeclarationListParser(typescriptParser);
  }

  public parse(forKeywordNode: TypeScriptForKeywordNode): TypeScriptForStatementNode | TypeScriptForInOrOfStatementNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const awaitKeywordNode = typescriptParser.tryConsume(TypeScriptAwaitKeywordNode);
    const openParenthesisNode = typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      typescriptParser.reportExpected(Resources.openParenthesis);

    const initializerNode = this.parseHeaderInitializer();
    const node = typescriptParser.currentNode;
    if (node instanceof TypeScriptOfKeywordNode)
      return this.parseForOf(forKeywordNode, awaitKeywordNode, openParenthesisNode, initializerNode!, node);
    if (!Object.isUndefined(awaitKeywordNode))
      typescriptParser.reportExpected(Resources.of);
    if (node instanceof TypeScriptInKeywordNode)
      return this.parseForIn(forKeywordNode, openParenthesisNode, initializerNode!, node);
    return this.parseFor(forKeywordNode, openParenthesisNode, initializerNode);
  }

  private parseFor(forKeywordNode: TypeScriptForKeywordNode, openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    initializerNode: Node | undefined): TypeScriptForStatementNode {
    const typescriptParser = this.typescriptParser;
    const firstSemicolonNode = typescriptParser.tryConsume(TypeScriptSemicolonNode);
    if (Object.isUndefined(firstSemicolonNode))
      typescriptParser.reportExpected(Resources.semicolon);

    const conditionNode = typescriptParser.currentNode instanceof TypeScriptSemicolonNode
      || typescriptParser.currentNode instanceof TypeScriptCloseParenthesisNode
      ? undefined
      : typescriptParser.parseExpressionAllowingIn();
    const secondSemicolonNode = typescriptParser.tryConsume(TypeScriptSemicolonNode);
    if (Object.isUndefined(secondSemicolonNode))
      typescriptParser.reportExpected(Resources.semicolon);

    const incrementorNode = typescriptParser.currentNode instanceof TypeScriptCloseParenthesisNode
      ? undefined
      : typescriptParser.parseExpressionAllowingIn();
    const closeParenthesisNode = this.consumeCloseParenthesis();
    const statementNode = typescriptParser.parseIterationBody();
    const resultNode = new TypeScriptForStatementNode(
      forKeywordNode,
      statementNode,
      typescriptParser.typescriptLexer.reader.createSpan(forKeywordNode.span, statementNode.span),
      openParenthesisNode,
      initializerNode,
      firstSemicolonNode,
      conditionNode,
      secondSemicolonNode,
      incrementorNode,
      closeParenthesisNode,
      forKeywordNode.leadingTrivia,
      statementNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  private parseForIn(forKeywordNode: TypeScriptForKeywordNode, openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    initializerNode: Node, inKeywordNode: TypeScriptInKeywordNode): TypeScriptForInStatementNode {
    const typescriptParser = this.typescriptParser;
    initializerNode.markTypeScriptPattern(typescriptParser.context);
    typescriptParser.advance();
    const expressionNode = typescriptParser.parseExpressionAllowingIn();
    const closeParenthesisNode = this.consumeCloseParenthesis();
    const statementNode = typescriptParser.parseIterationBody();
    const resultNode = new TypeScriptForInStatementNode(
      forKeywordNode,
      initializerNode,
      inKeywordNode,
      expressionNode,
      statementNode,
      typescriptParser.typescriptLexer.reader.createSpan(forKeywordNode.span, statementNode.span),
      openParenthesisNode,
      closeParenthesisNode,
      forKeywordNode.leadingTrivia,
      statementNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  private parseForOf(forKeywordNode: TypeScriptForKeywordNode, awaitKeywordNode: TypeScriptAwaitKeywordNode | undefined,
    openParenthesisNode: TypeScriptOpenParenthesisNode | undefined, initializerNode: Node, ofKeywordNode: TypeScriptOfKeywordNode): TypeScriptForOfStatementNode {
    const typescriptParser = this.typescriptParser;
    const context = typescriptParser.context;
    if (!Object.isUndefined(awaitKeywordNode) && context.isClassStaticBlock)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18038, awaitKeywordNode.span);
    else if (!Object.isUndefined(awaitKeywordNode) && !context.isAwaitContext)
      context.records.writtenAwaits.push(new TypeScriptWrittenAwait(awaitKeywordNode, true, context.isSourceTopLevel));
    initializerNode.markTypeScriptPattern(context);
    typescriptParser.advance();
    const expressionNode = typescriptParser.parseAssignmentExpressionAllowingIn();
    const closeParenthesisNode = this.consumeCloseParenthesis();
    const statementNode = typescriptParser.parseIterationBody();
    const resultNode = new TypeScriptForOfStatementNode(
      forKeywordNode,
      initializerNode,
      ofKeywordNode,
      expressionNode,
      statementNode,
      typescriptParser.typescriptLexer.reader.createSpan(forKeywordNode.span, statementNode.span),
      awaitKeywordNode,
      openParenthesisNode,
      closeParenthesisNode,
      forKeywordNode.leadingTrivia,
      statementNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(context);
    return resultNode;
  }

  private parseHeaderInitializer(): Node | undefined {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node instanceof TypeScriptSemicolonNode)
      return undefined;

    if (node.isTypeScriptForVariableDeclarationStart(typescriptParser)) {
      if (node instanceof TypeScriptAwaitKeywordNode) {
        typescriptParser.advance();
        return this.variableDeclarationListParser.parseWithoutIn(typescriptParser.requireCurrentNode(TypeScriptUsingKeywordNode), node);
      }
      return this.variableDeclarationListParser.parseWithoutIn(node);
    }

    return typescriptParser.parseExpressionWithoutIn();
  }

  private consumeCloseParenthesis(): TypeScriptCloseParenthesisNode | undefined {
    const typescriptParser = this.typescriptParser;
    const closeParenthesisNode = typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      typescriptParser.reportExpected(Resources.closeParenthesis);

    return closeParenthesisNode;
  }
}
