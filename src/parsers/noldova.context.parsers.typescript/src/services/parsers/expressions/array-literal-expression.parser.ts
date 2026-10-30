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
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptArrayLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-array-literal-expression.node.js";
import { TypeScriptOmittedExpressionNode } from "../../../models/nodes/expressions/typescript-omitted-expression.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ArrayLiteralExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(openBracketNode: TypeScriptOpenBracketNode): TypeScriptArrayLiteralExpressionNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~(TypeScriptContextFlags.Decorator | TypeScriptContextFlags.ConditionalTrueBranch);
    this.typescriptParser.context.enterList(TypeScriptListKind.ArrayLiteralMembers);
    try {
      this.typescriptParser.advance();
      const elementNodes: Node[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = openBracketNode;
      while (!this.typescriptParser.isEndOfFile && !(this.typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)) {
        const startNode = this.typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.ArrayLiteralMembers, this.typescriptParser)) {
          context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1137, startNode.span);
          if (context.isListBoundary(this.typescriptParser))
            break;
          endNode = startNode;
          this.typescriptParser.advance();
          continue;
        }
        const elementNode = this.parseElement();
        elementNodes.push(elementNode);
        endNode = elementNode;

        const commaNode = this.typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (this.typescriptParser.isEndOfFile || this.typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)
          break;
        this.typescriptParser.reportExpected(Resources.comma);
      }

      const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
      if (Object.isUndefined(closeBracketNode))
        context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(context.source, this.typescriptParser.currentNode.span,
          openBracketNode.span, Resources.openBracket, Resources.closeBracket);
      else
        endNode = closeBracketNode;

      const span = this.typescriptParser.typescriptLexer.reader.createSpan(openBracketNode.span, endNode.span);
      return new TypeScriptArrayLiteralExpressionNode(
        openBracketNode,
        elementNodes,
        commaNodes,
        span,
        closeBracketNode,
        openBracketNode.leadingTrivia,
        endNode.trailingTrivia);
    }
    finally {
      this.typescriptParser.context.leaveList();
      context.contextFlags = previousFlags;
    }
  }

  private parseElement(): Node {
    const node = this.typescriptParser.currentNode;
    if (node instanceof TypeScriptCommaNode)
      return new TypeScriptOmittedExpressionNode(this.typescriptParser.typescriptLexer.reader.createSpan(node.span.startOffset, 0), node.leadingTrivia);

    return node instanceof TypeScriptDotDotDotNode
      ? node.parseTypeScriptSpreadElement(this.typescriptParser)
      : this.typescriptParser.parseAssignmentExpression();
  }
}
