/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDecoratorNode } from "../../../models/nodes/declarations/typescript-decorator.node.js";
import type { TypeScriptAtNode } from "../../../models/nodes/delimiters/typescript-at.node.js";
import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class DecoratorParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(atNode: TypeScriptAtNode): TypeScriptDecoratorNode {
    const parser = this.typescriptParser;
    const context = parser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags |= TypeScriptContextFlags.Decorator;
    try {
      parser.advance();
      const nameNode = parser.currentNode;
      let missingName: TypeScriptMissingExpressionNode | undefined;
      if (context.isAwaitContext && nameNode instanceof TypeScriptAwaitKeywordNode) {
        context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, nameNode.span);
        parser.advance();
        missingName = new TypeScriptMissingExpressionNode(nameNode.span, nameNode, nameNode.leadingTrivia, nameNode.trailingTrivia);
      }
      else if (!nameNode.canStartTypeScriptPrimaryExpression(parser)) {
        context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, nameNode.span);
        missingName = new TypeScriptMissingExpressionNode(nameNode.getTypeScriptMissingNodeSpan());
      }
      const expressionNode = parser.parseLeftHandSideExpression(missingName);
      return new TypeScriptDecoratorNode(atNode, parser.typescriptLexer.reader.createSpan(atNode.span, expressionNode.span),
        expressionNode, atNode.leadingTrivia, expressionNode.trailingTrivia);
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }
}
