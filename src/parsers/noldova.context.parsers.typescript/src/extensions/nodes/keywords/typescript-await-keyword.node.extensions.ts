/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAwaitKeywordNode.prototype.isTypeScriptVariableStatementStart = function (this: TypeScriptAwaitKeywordNode, parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptUsingKeywordNode && parser.currentNode.isTypeScriptVariableStatementStart(parser);
  });
};

TypeScriptAwaitKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptAwaitKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptVariableStatementStart(parser);
};

TypeScriptAwaitKeywordNode.prototype.isTypeScriptForVariableDeclarationStart = function (this: TypeScriptAwaitKeywordNode, parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode {
  return this.isTypeScriptVariableStatementStart(parser);
};

TypeScriptAwaitKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptAwaitKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  if (!this.isTypeScriptVariableStatementStart(parser))
    return parser.parseExpressionOrLabeledStatement();
  parser.advance();
  return parser.parseVariableStatement(parser.requireCurrentNode(TypeScriptUsingKeywordNode), modifierNodes, this);
};

TypeScriptAwaitKeywordNode.prototype.isTypeScriptIdentifier = function (this: TypeScriptAwaitKeywordNode, context: TypeScriptParserContext): boolean {
  return !context.isAwaitContext;
};

TypeScriptAwaitKeywordNode.prototype.isTypeScriptAwaitExpressionStart = function (
  this: TypeScriptAwaitKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode {
  return parser.context.isAwaitContext || parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.canFollowTypeScriptUnscopedAwaitOrYield();
  });
};

TypeScriptAwaitKeywordNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptAwaitKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return this.isTypeScriptAwaitExpressionStart(parser) ? parser.parseAwaitExpression(this) : parser.parsePostfixUnaryExpression();
};

TypeScriptAwaitKeywordNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptAwaitKeywordNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptAwaitKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptAwaitKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Await;
};
