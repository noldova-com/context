/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptExpressionStatementNode } from "../../../models/nodes/statements/typescript-expression-statement.node.js";
import { TypeScriptLabeledStatementNode } from "../../../models/nodes/statements/typescript-labeled-statement.node.js";
import { TypeScriptJumpTarget } from "../../../models/typescript-jump-target.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ExpressionOrLabeledStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(): TypeScriptExpressionStatementNode | TypeScriptLabeledStatementNode {
    const expressionNode = this.typescriptParser.parseExpression();
    if (expressionNode.isTypeScriptIdentifier(this.typescriptParser.context) && this.typescriptParser.currentNode instanceof TypeScriptColonNode) {
      const colonNode = this.typescriptParser.currentNode;
      this.typescriptParser.advance();
      const context = this.typescriptParser.context;
      const labelText = expressionNode.getTypeScriptDiagnosticText();
      if (!(context.isAmbient && !context.hasReportedAmbientStatement)
        && context.jumpTargets.some(t => t.labelNode?.getTypeScriptDiagnosticText() === labelText))
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1114, expressionNode.span, [labelText]);
      const labelsIteration = this.typescriptParser.lookAhead(() => {
        while (this.typescriptParser.currentNode.isTypeScriptIdentifier(context)) {
          this.typescriptParser.advance();
          if (!(this.typescriptParser.currentNode instanceof TypeScriptColonNode))
            return false;
          this.typescriptParser.advance();
        }
        return this.typescriptParser.currentNode.isTypeScriptIterationStart();
      });
      const previousNested = context.isNestedStatement;
      context.isNestedStatement = true;
      context.jumpTargets.push(new TypeScriptJumpTarget(expressionNode, labelsIteration));
      let statementNode: Node;
      try {
        statementNode = this.typescriptParser.parseStatement();
      }
      finally {
        context.isNestedStatement = previousNested;
        context.jumpTargets.pop();
      }

      const resultNode = new TypeScriptLabeledStatementNode(expressionNode, colonNode, statementNode,
        this.typescriptParser.typescriptLexer.reader.createSpan(expressionNode.span, statementNode.span),
        expressionNode.leadingTrivia, statementNode.trailingTrivia);

      resultNode.validateTypeScriptGrammar(context);
      return resultNode;
    }
    const semicolonNode = this.typescriptParser.parseStatementTerminator(expressionNode);
    const endNode = semicolonNode ?? expressionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(expressionNode.span, endNode.span);

    return new TypeScriptExpressionStatementNode(expressionNode, span, semicolonNode, expressionNode.leadingTrivia, endNode.trailingTrivia);
  }
}
