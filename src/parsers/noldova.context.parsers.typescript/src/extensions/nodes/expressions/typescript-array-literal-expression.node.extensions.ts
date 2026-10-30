/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptArrayLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-array-literal-expression.node.js";
import { TypeScriptOmittedExpressionNode } from "../../../models/nodes/expressions/typescript-omitted-expression.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptArrayLiteralExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptArrayLiteralExpressionNode): boolean {
  return true;
};

TypeScriptArrayLiteralExpressionNode.prototype.validateTypeScriptAssignmentTarget = function (this: TypeScriptArrayLiteralExpressionNode, context: TypeScriptParserContext, operatorNode: Node): void {
  if (operatorNode instanceof TypeScriptEqualsNode)
    this.reportTypeScriptRestTrailingComma(context);
};

TypeScriptArrayLiteralExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptArrayLiteralExpressionNode): SourceSpan {
  return this.openBracketNode.span;
};

TypeScriptArrayLiteralExpressionNode.prototype.markTypeScriptPattern = function (this: TypeScriptArrayLiteralExpressionNode, context: TypeScriptParserContext): void {
  context.records.patternLiterals.push(this);
  for (const elementNode of this.children)
    elementNode.markTypeScriptPattern(context);
};

TypeScriptArrayLiteralExpressionNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptArrayLiteralExpressionNode,
  context: TypeScriptParserContext): void {
  for (const elementNode of this.children)
    if (!(elementNode instanceof TypeScriptOmittedExpressionNode))
      elementNode.validateTypeScriptDestructuringTarget(context);
  this.children.at(-1)?.reportTypeScriptRestInitializer(context);
};

TypeScriptArrayLiteralExpressionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptArrayLiteralExpressionNode): boolean {
  return true;
};

TypeScriptArrayLiteralExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptArrayLiteralExpressionNode): boolean {
  return true;
};

TypeScriptArrayLiteralExpressionNode.prototype.validateTypeScriptIterationInitializer = function (this: TypeScriptArrayLiteralExpressionNode, context: TypeScriptParserContext,
  isForOf: boolean): void {
  if (isForOf)
    this.validateTypeScriptDestructuringTarget(context);
  else
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2491, this.span);
};
