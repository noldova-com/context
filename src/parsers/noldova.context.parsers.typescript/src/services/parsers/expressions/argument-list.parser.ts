/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptArgumentListNode } from "../../../models/nodes/expressions/typescript-argument-list.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ArgumentListParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(openParenthesisNode?: TypeScriptOpenParenthesisNode): TypeScriptArgumentListNode {
    const startNode = openParenthesisNode ?? this.typescriptParser.currentNode;
    if (Object.isUndefined(openParenthesisNode))
      this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, startNode.span, [Resources.openParenthesis]);
    else
      this.typescriptParser.advance();
    return this.parseArguments(startNode, openParenthesisNode, [], [], openParenthesisNode);
  }

  public parseRest(openParenthesisNode: TypeScriptOpenParenthesisNode, argumentNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[]): TypeScriptArgumentListNode {
    if (!this.isTerminator())
      this.typescriptParser.reportExpected(Resources.comma);
    const endNode = commaNodes.length === argumentNodes.length ? commaNodes.at(-1) : argumentNodes.at(-1);
    return this.parseArguments(openParenthesisNode, openParenthesisNode, [...argumentNodes], [...commaNodes], endNode ?? openParenthesisNode);
  }

  private isTerminator(): boolean {
    return this.typescriptParser.isEndOfFile || this.typescriptParser.currentNode instanceof TypeScriptCloseParenthesisNode
      || this.typescriptParser.currentNode instanceof TypeScriptSemicolonNode;
  }

  private parseArguments(startNode: Node, openParenthesisNode: TypeScriptOpenParenthesisNode | undefined, argumentNodes: Node[],
    commaNodes: TypeScriptCommaNode[], firstEndNode: Node | undefined): TypeScriptArgumentListNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~(TypeScriptContextFlags.Decorator | TypeScriptContextFlags.ConditionalTrueBranch | TypeScriptContextFlags.DisallowIn);
    context.enterList(TypeScriptListKind.ArgumentExpressions);
    try {
      let endNode: Node | undefined = firstEndNode;
      while (!this.isTerminator()) {
        const currentNode = this.typescriptParser.currentNode;
        if (this.typescriptParser.currentNode instanceof TypeScriptCommaNode)
          this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(
            TypeScriptDiagnosticTemplates.TS1135, this.typescriptParser.currentNode.span);
        else {
          if (!currentNode.isTypeScriptListElement(TypeScriptListKind.ArgumentExpressions, this.typescriptParser)) {
            this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1135, currentNode.span);
            if (context.isListBoundary(this.typescriptParser))
              break;
            this.typescriptParser.advance();
            endNode = currentNode;
            continue;
          }
          const argumentNode = this.typescriptParser.currentNode instanceof TypeScriptDotDotDotNode
            ? this.typescriptParser.currentNode.parseTypeScriptSpreadElement(this.typescriptParser)
            : this.typescriptParser.parseAssignmentExpression();
          argumentNodes.push(argumentNode);
          endNode = argumentNode;
        }

        const commaNode = this.typescriptParser.tryConsume(TypeScriptCommaNode);
        if (Object.isUndefined(commaNode)) {
          if (this.isTerminator())
            break;
          this.typescriptParser.reportExpected(Resources.comma);
          continue;
        }

        commaNodes.push(commaNode);
        endNode = commaNode;
      }

      const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
      if (Object.isUndefined(closeParenthesisNode))
        this.typescriptParser.reportExpected(Resources.closeParenthesis);
      else
        endNode = closeParenthesisNode;

      const span = Object.isUndefined(endNode)
        ? startNode.getTypeScriptMissingNodeSpan()
        : this.typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      return new TypeScriptArgumentListNode(
        openParenthesisNode,
        argumentNodes,
        commaNodes,
        span,
        closeParenthesisNode,
        Object.isUndefined(endNode) ? undefined : startNode.leadingTrivia,
        endNode?.trailingTrivia);
    }
    finally {
      context.leaveList();
      context.contextFlags = previousFlags;
    }
  }
}
