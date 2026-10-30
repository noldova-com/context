/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptArrowFunctionNode } from "../../../models/nodes/expressions/typescript-arrow-function.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptYieldExpressionNode } from "../../../models/nodes/expressions/typescript-yield-expression.node.js";
import { TypeScriptYieldKeywordNode } from "../../../models/nodes/keywords/typescript-yield-keyword.node.js";
import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ConditionalExpressionParser } from "./conditional-expression.parser.js";

export class AssignmentExpressionParser {
  private readonly conditionalExpressionParser: ConditionalExpressionParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.conditionalExpressionParser = new ConditionalExpressionParser(typescriptParser);
  }

  public parse(): Node {
    return this.parseAssignment();
  }

  public parseAllowingIn(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~TypeScriptContextFlags.DisallowIn;
    try {
      return this.parseAssignment();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  public parseExpressionOrParameter(): Node {
    return this.parseAssignment(true);
  }

  private parseAssignment(allowsParameterAnnotation: boolean = false): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      const typescriptParser = this.typescriptParser;
      const node = typescriptParser.currentNode;
      if (node.isTypeScriptYieldExpressionStart(typescriptParser))
        return this.parseYieldExpression(node);

      const expressionNode = node.tryParseTypeScriptAssignmentStart(typescriptParser);

      if (expressionNode instanceof TypeScriptArrowFunctionNode)
        return expressionNode;

      const unaryNode = Object.isUndefined(expressionNode)
        ? typescriptParser.parseUnaryExpression()
        : typescriptParser.parseUnaryExpression(typescriptParser.parseLeftHandSideExpression(expressionNode));
      if (unaryNode.isTypeScriptBindingIdentifier() && typescriptParser.currentNode instanceof TypeScriptArrowNode)
        return typescriptParser.parseArrowFunctionWithParameter(unaryNode);

      const binaryNode = typescriptParser.parseBinaryExpression(unaryNode);
      const operatorNode = typescriptParser.currentNode;
      if (!binaryNode.isTypeScriptLeftHandSideExpression() || !operatorNode.isTypeScriptAssignmentOperator())
        return this.conditionalExpressionParser.parse(binaryNode, allowsParameterAnnotation);

      binaryNode.validateTypeScriptAssignmentTarget(typescriptParser.context, operatorNode);
      if (operatorNode instanceof TypeScriptEqualsNode)
        binaryNode.validateTypeScriptDestructuringTarget(typescriptParser.context);
      else
        binaryNode.validateTypeScriptReference(typescriptParser.context, TypeScriptDiagnosticTemplates.TS2364, TypeScriptDiagnosticTemplates.TS2779);
      typescriptParser.readEvalOrArgumentsName(binaryNode);
      binaryNode.markTypeScriptPattern(typescriptParser.context);
      typescriptParser.advance();
      const rightNode = this.parse();
      const span = typescriptParser.typescriptLexer.reader.createSpan(binaryNode.span, rightNode.span);
      return new TypeScriptBinaryExpressionNode(binaryNode, operatorNode, span, rightNode, binaryNode.leadingTrivia, rightNode.trailingTrivia);
    }
    finally {
      context.leaveRecursion();
    }
  }

  private parseYieldExpression(yieldKeywordNode: TypeScriptYieldKeywordNode): TypeScriptYieldExpressionNode {
    const typescriptParser = this.typescriptParser;
    if (!typescriptParser.context.isYieldContext)
      typescriptParser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(typescriptParser.context.source, TypeScriptDiagnosticTemplates.TS1163, yieldKeywordNode.span);
    typescriptParser.advance();
    let asteriskNode: TypeScriptAsteriskNode | undefined;
    let expressionNode: Node | undefined;
    if (!typescriptParser.hasPrecedingLineBreak()
      && (typescriptParser.currentNode instanceof TypeScriptAsteriskNode || typescriptParser.currentNode.canStartTypeScriptExpression(typescriptParser))) {
      asteriskNode = typescriptParser.tryConsume(TypeScriptAsteriskNode);
      expressionNode = this.parse();
    }
    const endNode = expressionNode ?? asteriskNode ?? yieldKeywordNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(yieldKeywordNode.span, endNode.span);
    return new TypeScriptYieldExpressionNode(yieldKeywordNode, span, asteriskNode, expressionNode, yieldKeywordNode.leadingTrivia, endNode.trailingTrivia);
  }
}
