/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptArrowHeadKind } from "../../../enums/typescript-arrow-head-kind.js";
import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptArgumentListNode } from "../../../models/nodes/expressions/typescript-argument-list.node.js";
import type { TypeScriptArrowFunctionNode } from "../../../models/nodes/expressions/typescript-arrow-function.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptCallExpressionNode } from "../../../models/nodes/expressions/typescript-call-expression.node.js";
import { TypeScriptParenthesizedExpressionNode } from "../../../models/nodes/expressions/typescript-parenthesized-expression.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { ArgumentListParser } from "./argument-list.parser.js";

export class ParenthesizedExpressionParser {
  private readonly argumentListParser: ArgumentListParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.argumentListParser = new ArgumentListParser(typescriptParser);
    this.parameterListParser = new ParameterListParser(typescriptParser);
  }

  public tryParseExpressionOrArrowFunction(): Node | undefined {
    const parser = this.typescriptParser;
    const headKind = parser.recognizeArrowHead();
    if (headKind === TypeScriptArrowHeadKind.Arrow) {
      const definiteNode = parser.parseArrowFunctionDefinite();
      if (!Object.isUndefined(definiteNode))
        return definiteNode;
    }
    if (headKind === TypeScriptArrowHeadKind.Parameters)
      return parser.tryParseArrowFunction();
    const parameterContext = parser.currentNode instanceof TypeScriptAsyncKeywordNode ? TypeScriptContextFlags.Await : TypeScriptContextFlags.None;
    const arrowNode = parameterContext === (parser.context.contextFlags & ~TypeScriptContextFlags.ConditionalTrueBranch)
      ? undefined : parser.tryParseArrowFunction();
    return arrowNode
      ?? this.typescriptParser.tryParse(() => this.parseExpressionOrArrowFunction(headKind))
      ?? (parser.recognizeArrowHead() === TypeScriptArrowHeadKind.Parameters ? parser.tryParseArrowFunction() : undefined);
  }

  private parseExpressionOrArrowFunction(headKind: TypeScriptArrowHeadKind): Node | undefined {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const asyncKeywordNode = startNode instanceof TypeScriptAsyncKeywordNode ? startNode : undefined;
    const parameterContext = Object.isUndefined(asyncKeywordNode) ? TypeScriptContextFlags.None : TypeScriptContextFlags.Await;
    const context = parser.context;
    const hasParameterContext = parameterContext === (context.contextFlags & ~TypeScriptContextFlags.ConditionalTrueBranch);
    const readsParameters = headKind !== TypeScriptArrowHeadKind.NotArrow && hasParameterContext;
    const flags = parameterContext | (context.contextFlags & TypeScriptContextFlags.ConditionalTrueBranch);
    if (readsParameters && context.getRejectedArrowOffsets(flags).has(startNode.span.startOffset)) {
      context.hasReadListBoundary = true;
      return undefined;
    }
    if (!Object.isUndefined(asyncKeywordNode))
      parser.consumeName();
    if (!Object.isUndefined(asyncKeywordNode) && parser.hasPrecedingLineBreak())
      return undefined;

    const openParenthesisNode = parser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      return undefined;

    const parameterAwaitCount = parser.context.records.writtenAwaits.length;
    const itemNodes: Node[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    const previousBoundaryRead = context.hasReadListBoundary;
    context.hasReadListBoundary = false;
    let hasReadParameterBoundary = false;
    if (readsParameters)
      context.enterList(TypeScriptListKind.Parameters);
    try {
      while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseParenthesisNode)) {
        if (!Object.isUndefined(asyncKeywordNode) && parser.currentNode instanceof TypeScriptCommaNode)
          return undefined;
        if (readsParameters && (parser.currentNode instanceof TypeScriptOpenBraceNode || parser.currentNode instanceof TypeScriptOpenBracketNode))
          return this.leaveHeadToParameters(startNode);

        const itemNode = this.parseItem();
        if (Object.isUndefined(itemNode))
          return undefined;

        itemNodes.push(itemNode);
        const commaNode = parser.tryConsume(TypeScriptCommaNode);
        if (Object.isUndefined(commaNode))
          break;

        commaNodes.push(commaNode);
      }
      hasReadParameterBoundary = readsParameters && context.hasReadListBoundary;
    }
    finally {
      if (readsParameters)
        context.leaveList();
      context.hasReadListBoundary ||= previousBoundaryRead;
    }

    const closeParenthesisNode = parser.tryConsume(TypeScriptCloseParenthesisNode);
    if (readsParameters && (Object.isUndefined(closeParenthesisNode)
      ? !parser.isEndOfFile && !parser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.Parameters, parser)
      : parser.currentNode instanceof TypeScriptArrowNode || parser.currentNode instanceof TypeScriptColonNode
        || parser.currentNode instanceof TypeScriptOpenBraceNode || itemNodes.some(t => t instanceof TypeScriptParameterNode))) {
      const parameterNodes = this.toParameters(itemNodes);
      if (Object.isUndefined(parameterNodes))
        return this.leaveHeadToParameters(startNode);
      const arrowFunctionNode = this.tryParseArrowFunction(openParenthesisNode, itemNodes, parameterNodes, commaNodes, closeParenthesisNode,
        parameterAwaitCount, asyncKeywordNode);
      if (!Object.isUndefined(arrowFunctionNode))
        return arrowFunctionNode;
    }

    if (itemNodes.some(t => t instanceof TypeScriptParameterNode))
      return undefined;

    if (hasParameterContext) {
      const rejected = context.hasReadListBoundary ? context.getRejectedArrowOffsets(flags) : context.getSharedRejectedArrowOffsets(flags);
      rejected.add(startNode.span.startOffset);
    }
    if (hasReadParameterBoundary)
      return undefined;
    if (!Object.isUndefined(asyncKeywordNode))
      return this.finishAsyncCall(asyncKeywordNode, openParenthesisNode, itemNodes, commaNodes, closeParenthesisNode);

    return this.finishParenthesizedExpression(openParenthesisNode, itemNodes, commaNodes, closeParenthesisNode);
  }

  private finishParenthesizedExpression(
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    itemNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined): TypeScriptParenthesizedExpressionNode {
    const parser = this.typescriptParser;
    const endTokenNode = closeParenthesisNode ?? parser.currentNode;
    let expressionNode = itemNodes[0] ?? endTokenNode.reportTypeScriptMissingExpression(parser);
    for (let index = 0; index < commaNodes.length; index++) {
      const rightNode = itemNodes[index + 1] ?? endTokenNode.reportTypeScriptMissingExpression(parser);
      const expressionSpan = parser.typescriptLexer.reader.createSpan(expressionNode.span, rightNode.span);
      expressionNode = new TypeScriptBinaryExpressionNode(
        expressionNode, commaNodes[index]!, expressionSpan, rightNode, expressionNode.leadingTrivia, rightNode.trailingTrivia);
    }

    if (Object.isUndefined(closeParenthesisNode))
      parser.reportExpected(Resources.closeParenthesis);

    const endNode = closeParenthesisNode ?? expressionNode;
    const span = parser.typescriptLexer.reader.createSpan(openParenthesisNode.span, endNode.span);
    return new TypeScriptParenthesizedExpressionNode(
      openParenthesisNode, expressionNode, closeParenthesisNode, span, openParenthesisNode.leadingTrivia, endNode.trailingTrivia);
  }

  private leaveHeadToParameters(startNode: Node): undefined {
    this.typescriptParser.context.getArrowHeadKinds().set(startNode.span.startOffset, TypeScriptArrowHeadKind.Parameters);
    return undefined;
  }

  private toParameters(itemNodes: readonly Node[]): TypeScriptParameterNode[] | undefined {
    const parameterNodes: TypeScriptParameterNode[] = [];
    for (const itemNode of itemNodes) {
      const parameterNode = itemNode.toTypeScriptParameter();
      if (Object.isUndefined(parameterNode))
        return undefined;

      parameterNodes.push(parameterNode);
    }
    return parameterNodes;
  }

  private tryParseArrowFunction(
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    itemNodes: readonly Node[],
    parameterNodes: TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined,
    parameterAwaitCount: number,
    asyncKeywordNode?: TypeScriptAsyncKeywordNode): TypeScriptArrowFunctionNode | undefined {
    const parser = this.typescriptParser;
    const previousBoundaryRead = parser.context.hasReadListBoundary;
    const arrowFunctionNode = parser.tryParse(() => {
      for (let index = 0; index < itemNodes.length; index++) {
        const parameterNode = parameterNodes[index]!;
        parameterNode.readTypeScriptEvalOrArgumentsNames(parser);
        if (parameterNode !== itemNodes[index])
          parser.readNameAsBinding(parameterNode.nameNode);
      }
      const parameterCommaNodes = [...commaNodes];
      let endNode = closeParenthesisNode;
      if (Object.isUndefined(endNode)) {
        parser.reportExpected(Resources.comma);
        if (Object.isUndefined(this.parameterListParser.parseParameters(openParenthesisNode, parameterNodes, parameterCommaNodes, true)))
          return undefined;
        endNode = parser.tryConsume(TypeScriptCloseParenthesisNode);
        if (Object.isUndefined(endNode))
          return undefined;
      }
      const span = parser.typescriptLexer.reader.createSpan(openParenthesisNode.span, endNode.span);
      const parameterListNode = new TypeScriptParameterListNode(
        openParenthesisNode, parameterNodes, parameterCommaNodes, span, endNode, openParenthesisNode.leadingTrivia, endNode.trailingTrivia);
      const headDiagnosticCount = parser.context.diagnosticCollector.diagnostics.length;
      parameterListNode.validateTypeScriptGrammar(parser.context);
      return parser.parseArrowFunctionWithParameters(parameterListNode, parameterAwaitCount, asyncKeywordNode,
        parser.context.diagnosticCollector.diagnostics.length !== headDiagnosticCount);
    });
    if (Object.isUndefined(arrowFunctionNode))
      parser.context.hasReadListBoundary = previousBoundaryRead;
    return arrowFunctionNode;
  }

  private finishAsyncCall(
    asyncKeywordNode: TypeScriptAsyncKeywordNode,
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    itemNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined): TypeScriptCallExpressionNode {
    const reader = this.typescriptParser.typescriptLexer.reader;
    const argumentListNode = Object.isUndefined(closeParenthesisNode)
      ? this.argumentListParser.parseRest(openParenthesisNode, itemNodes, commaNodes)
      : new TypeScriptArgumentListNode(openParenthesisNode, itemNodes, commaNodes, reader.createSpan(openParenthesisNode.span, closeParenthesisNode.span),
        closeParenthesisNode, openParenthesisNode.leadingTrivia, closeParenthesisNode.trailingTrivia);
    const span = reader.createSpan(asyncKeywordNode.span, argumentListNode.span);
    return new TypeScriptCallExpressionNode(asyncKeywordNode, span, argumentListNode, undefined, undefined, asyncKeywordNode.leadingTrivia,
      argumentListNode.trailingTrivia);
  }

  private parseItem(): Node | undefined {
    const parser = this.typescriptParser;
    const previousFlags = parser.context.contextFlags;
    parser.context.contextFlags &= ~(TypeScriptContextFlags.ConditionalTrueBranch | TypeScriptContextFlags.DisallowIn);
    try {
      if (parser.currentNode instanceof TypeScriptDotDotDotNode || parser.currentNode instanceof TypeScriptThisKeywordNode
        || parser.currentNode.canParseTypeScriptParameterModifier(parser))
        return this.parameterListParser.parseParameter();

      const expressionNode = parser.parseAssignmentExpressionOrParameter();
      if (!(parser.currentNode instanceof TypeScriptColonNode) && !(parser.currentNode instanceof TypeScriptQuestionNode))
        return expressionNode;

      const nameNode = expressionNode.toTypeScriptBindingName();
      if (Object.isUndefined(nameNode))
        return undefined;
      parser.readNameAsBinding(nameNode);
      return this.parameterListParser.parseParameter(nameNode);
    }
    finally {
      parser.context.contextFlags = previousFlags;
    }
  }

  public parse(openParenthesisNode: TypeScriptOpenParenthesisNode): TypeScriptParenthesizedExpressionNode {
    this.typescriptParser.advance();
    const expressionNode = this.typescriptParser.parseExpressionAllowingIn();
    const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.reportExpected(Resources.closeParenthesis);

    const endNode = closeParenthesisNode ?? expressionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(openParenthesisNode.span, endNode.span);

    return new TypeScriptParenthesizedExpressionNode(
      openParenthesisNode,
      expressionNode,
      closeParenthesisNode,
      span,
      openParenthesisNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
