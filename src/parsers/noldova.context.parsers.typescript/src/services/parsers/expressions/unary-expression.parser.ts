/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptAwaitExpressionNode } from "../../../models/nodes/expressions/typescript-await-expression.node.js";
import { TypeScriptDeleteExpressionNode } from "../../../models/nodes/expressions/typescript-delete-expression.node.js";
import { TypeScriptPostfixUnaryExpressionNode } from "../../../models/nodes/expressions/typescript-postfix-unary-expression.node.js";
import { TypeScriptPrefixUnaryExpressionNode } from "../../../models/nodes/expressions/typescript-prefix-unary-expression.node.js";
import { TypeScriptTypeAssertionExpressionNode } from "../../../models/nodes/expressions/typescript-type-assertion-expression.node.js";
import { TypeScriptTypeOfExpressionNode } from "../../../models/nodes/expressions/typescript-type-of-expression.node.js";
import { TypeScriptVoidExpressionNode } from "../../../models/nodes/expressions/typescript-void-expression.node.js";
import type { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptDeleteKeywordNode } from "../../../models/nodes/keywords/typescript-delete-keyword.node.js";
import type { TypeScriptTypeOfKeywordNode } from "../../../models/nodes/keywords/typescript-type-of-keyword.node.js";
import type { TypeScriptVoidKeywordNode } from "../../../models/nodes/keywords/typescript-void-keyword.node.js";
import { TypeScriptAsteriskAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk-asterisk.node.js";
import { TypeScriptGreaterThanNode } from "../../../models/nodes/operators/typescript-greater-than.node.js";
import type { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptWrittenAwait } from "../../../models/typescript-written-await.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class UnaryExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(operandNode?: Node): Node {
    const startNode = this.typescriptParser.currentNode;
    const expressionNode = this.parseOperand(operandNode);
    if (this.typescriptParser.currentNode instanceof TypeScriptAsteriskAsteriskNode)
      startNode.reportTypeScriptUnaryExponentiationDiagnostic(this.typescriptParser, expressionNode);

    return expressionNode;
  }

  private parseOperand(operandNode?: Node): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      if (!Object.isUndefined(operandNode))
        return this.parsePostfixUnaryExpression(operandNode);

      const node = this.typescriptParser.currentNode;
      if (node.isTypeScriptClosingDelimiter())
        return node.reportTypeScriptMissingExpression(this.typescriptParser);
      return this.typescriptParser.currentNode.parseTypeScriptUnaryExpression(this.typescriptParser);
    }
    finally {
      context.leaveRecursion();
    }
  }

  public parsePostfixUnaryExpression(operandNode?: Node): Node {
    operandNode ??= this.typescriptParser.parseLeftHandSideExpression();
    const typescriptParser = this.typescriptParser;
    const operatorNode = typescriptParser.currentNode;
    if (operatorNode.isTypeScriptUpdateOperator()
      && !typescriptParser.hasPrecedingLineBreak()) {
      typescriptParser.advance();
      typescriptParser.readEvalOrArgumentsName(operandNode);
      this.validateUpdateOperand(operandNode);
      const span = typescriptParser.typescriptLexer.reader.createSpan(
        operandNode.span,
        operatorNode.span);
      return new TypeScriptPostfixUnaryExpressionNode(
        operandNode,
        operatorNode,
        span,
        operandNode.leadingTrivia,
        operatorNode.trailingTrivia);
    }

    return operandNode;
  }

  private validateUpdateOperand(operandNode: Node): void {
    if (!operandNode.skipTypeScriptOuterExpressions().isTypeScriptNonArithmeticLiteral())
      operandNode.validateTypeScriptReference(this.typescriptParser.context, TypeScriptDiagnosticTemplates.TS2357, TypeScriptDiagnosticTemplates.TS2777);
  }

  public parsePrefixUnaryExpression(operatorNode: Node): TypeScriptPrefixUnaryExpressionNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const isUpdate = operatorNode.isTypeScriptUpdateOperator();
    const operandNode = isUpdate ? typescriptParser.parseLeftHandSideExpression() : this.parseOperand();
    if (isUpdate) {
      typescriptParser.readEvalOrArgumentsName(operandNode);
      this.validateUpdateOperand(operandNode);
    }
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      operatorNode.span,
      operandNode.span);
    return new TypeScriptPrefixUnaryExpressionNode(
      operatorNode,
      span,
      operandNode,
      operatorNode.leadingTrivia,
      operandNode.trailingTrivia);
  }

  public parseDeleteExpression(deleteKeywordNode: TypeScriptDeleteKeywordNode): TypeScriptDeleteExpressionNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const expressionNode = this.parseOperand();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      deleteKeywordNode.span,
      expressionNode.span);
    const resultNode = new TypeScriptDeleteExpressionNode(
      deleteKeywordNode,
      span,
      expressionNode,
      deleteKeywordNode.leadingTrivia,
      expressionNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  public parseTypeOfExpression(typeOfKeywordNode: TypeScriptTypeOfKeywordNode): TypeScriptTypeOfExpressionNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const expressionNode = this.parseOperand();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      typeOfKeywordNode.span,
      expressionNode.span);
    return new TypeScriptTypeOfExpressionNode(
      typeOfKeywordNode,
      span,
      expressionNode,
      typeOfKeywordNode.leadingTrivia,
      expressionNode.trailingTrivia);
  }

  public parseVoidExpression(voidKeywordNode: TypeScriptVoidKeywordNode): TypeScriptVoidExpressionNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const expressionNode = this.parseOperand();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      voidKeywordNode.span,
      expressionNode.span);
    return new TypeScriptVoidExpressionNode(
      voidKeywordNode,
      span,
      expressionNode,
      voidKeywordNode.leadingTrivia,
      expressionNode.trailingTrivia);
  }

  public parseAwaitExpression(awaitKeywordNode: TypeScriptAwaitKeywordNode): TypeScriptAwaitExpressionNode {
    const typescriptParser = this.typescriptParser;
    const context = typescriptParser.context;
    if (!context.isAwaitContext && !context.isClassStaticBlock)
      context.records.writtenAwaits.push(new TypeScriptWrittenAwait(awaitKeywordNode, false, context.isSourceTopLevel));

    typescriptParser.advance();
    const expressionNode = this.parseOperand();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      awaitKeywordNode.span,
      expressionNode.span);
    if (context.isClassStaticBlock)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18037, span);

    return new TypeScriptAwaitExpressionNode(
      awaitKeywordNode,
      span,
      expressionNode,
      awaitKeywordNode.leadingTrivia,
      expressionNode.trailingTrivia);
  }

  public parseTypeAssertionExpression(lessThanNode: TypeScriptLessThanNode): TypeScriptTypeAssertionExpressionNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const typeNode = this.typescriptParser.parseType();
    const greaterThanNode = typescriptParser.tryConsume(TypeScriptGreaterThanNode);
    if (Object.isUndefined(greaterThanNode))
      typescriptParser.reportExpected(Resources.greaterThan);

    const expressionNode = this.parseOperand();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      lessThanNode.span,
      expressionNode.span);
    return new TypeScriptTypeAssertionExpressionNode(
      lessThanNode,
      span,
      typeNode,
      expressionNode,
      greaterThanNode,
      lessThanNode.leadingTrivia,
      expressionNode.trailingTrivia);
  }
}
