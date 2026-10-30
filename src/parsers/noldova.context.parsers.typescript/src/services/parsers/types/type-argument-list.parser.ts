/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, NodeType } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptTemplateMiddleNode } from "../../../models/nodes/literals/typescript-template-middle.node.js";
import { TypeScriptTemplateTailNode } from "../../../models/nodes/literals/typescript-template-tail.node.js";
import { TypeScriptGreaterThanNode } from "../../../models/nodes/operators/typescript-greater-than.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptShiftLeftNode } from "../../../models/nodes/operators/typescript-shift-left.node.js";
import { TypeScriptSlashEqualsNode } from "../../../models/nodes/operators/typescript-slash-equals.node.js";
import { TypeScriptSlashNode } from "../../../models/nodes/operators/typescript-slash.node.js";
import { TypeScriptTypeArgumentListNode } from "../../../models/nodes/types/typescript-type-argument-list.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class TypeArgumentListParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public tryParseExpressionSuffix(calleeNode?: Node): TypeScriptTypeArgumentListNode | undefined {
    const typescriptParser = this.typescriptParser;
    if (typescriptParser.context.unclosedTypeArgumentOffsets.has(typescriptParser.currentNode.span.startOffset)
      || !typescriptParser.lookAhead(() => this.mayHaveClosingGreaterThan()))
      return undefined;

    return typescriptParser.tryParse(() => {
      if (typescriptParser.currentNode instanceof TypeScriptShiftLeftNode)
        typescriptParser.reLexLessThan();

      const node = this.parseArguments(typescriptParser.requireCurrentNode(TypeScriptLessThanNode), true);
      if (Object.isUndefined(node) || Object.isUndefined(node.greaterThanNode)
        || !typescriptParser.currentNode.canFollowTypeScriptTypeArguments(typescriptParser))
        return undefined;

      if (!(calleeNode instanceof TypeScriptImportKeywordNode))
        node.validateTypeScriptGrammar(typescriptParser.context);

      return node;
    });
  }

  public parse(): TypeScriptTypeArgumentListNode | undefined {
    const lessThanNode = this.typescriptParser.currentNode;
    if (!(lessThanNode instanceof TypeScriptLessThanNode))
      return undefined;
    const resultNode = this.parseArguments(lessThanNode, false)!;
    resultNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }

  public parseOfTypeReference(): TypeScriptTypeArgumentListNode | undefined {
    if (this.typescriptParser.currentNode instanceof TypeScriptShiftLeftNode)
      this.typescriptParser.reLexLessThan();
    return this.parse();
  }

  private parseArguments(lessThanNode: TypeScriptLessThanNode, isExpressionContext: boolean): TypeScriptTypeArgumentListNode | undefined {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const argumentNodes: Node[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    let endNode: Node = lessThanNode;

    typescriptParser.context.enterList(TypeScriptListKind.TypeArguments);
    try {
      while (typescriptParser.currentNode.isTypeScriptListElement(TypeScriptListKind.TypeArguments, typescriptParser)) {
        const argumentNode = typescriptParser.parseType();
        argumentNodes.push(argumentNode);
        endNode = argumentNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (Object.isUndefined(commaNode))
          break;

        commaNodes.push(commaNode);
        endNode = commaNode;
      }
    }
    finally {
      typescriptParser.context.leaveList();
    }

    if (isExpressionContext && !typescriptParser.currentNode.isTypeScriptSingleGreaterThan(typescriptParser))
      return undefined;
    const greaterThanNode = typescriptParser.tryConsume(TypeScriptGreaterThanNode);
    if (Object.isUndefined(greaterThanNode))
      typescriptParser.reportExpected(Resources.greaterThan);
    else
      endNode = greaterThanNode;

    const span = typescriptParser.typescriptLexer.reader.createSpan(lessThanNode.span, endNode.span);

    return new TypeScriptTypeArgumentListNode(
      lessThanNode,
      argumentNodes,
      commaNodes,
      span,
      greaterThanNode,
      lessThanNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private mayHaveClosingGreaterThan(): boolean {
    const typescriptParser = this.typescriptParser;
    const openOffsets: number[] = [];
    const closingTypes: NodeType<Node>[] = [];
    while (!typescriptParser.isEndOfFile) {
      const node: Node = typescriptParser.currentNode;
      if (node instanceof TypeScriptTemplateHeadNode || node instanceof TypeScriptTemplateMiddleNode || node instanceof TypeScriptTemplateTailNode
        || node instanceof TypeScriptSlashNode || node instanceof TypeScriptSlashEqualsNode)
        return true;

      const closingType = node.getTypeScriptClosingDelimiterType();
      if (!Object.isUndefined(closingType))
        closingTypes.push(closingType);
      else if (node.isTypeScriptClosingDelimiter()) {
        const expectedType = closingTypes.at(-1);
        if (Object.isUndefined(expectedType))
          break;

        if (!expectedType.prototype.isPrototypeOf(node))
          return true;

        closingTypes.pop();
      }
      else if (closingTypes.length === 0) {
        if (node instanceof TypeScriptSemicolonNode)
          break;

        if (node instanceof TypeScriptShiftLeftNode) {
          openOffsets.push(node.span.startOffset);
          openOffsets.push(node.span.startOffset + 1);
        }
        else if (node instanceof TypeScriptLessThanNode)
          openOffsets.push(node.span.startOffset);
        else if (node instanceof TypeScriptGreaterThanNode) {
          openOffsets.pop();
          if (openOffsets.length === 0)
            return true;
        }
      }

      typescriptParser.advance();
    }

    if (closingTypes.length > 0)
      return true;

    for (const offset of openOffsets)
      typescriptParser.context.unclosedTypeArgumentOffsets.add(offset);

    return false;
  }
}
