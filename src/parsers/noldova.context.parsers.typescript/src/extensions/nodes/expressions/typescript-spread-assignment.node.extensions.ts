/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptArrayLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-array-literal-expression.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptObjectLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-object-literal-expression.node.js";
import { TypeScriptSpreadAssignmentNode } from "../../../models/nodes/expressions/typescript-spread-assignment.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptSpreadAssignmentNode.prototype.markTypeScriptPattern = function (this: TypeScriptSpreadAssignmentNode, context: TypeScriptParserContext): void {
  this.expressionNode.markTypeScriptPattern(context);
};

TypeScriptSpreadAssignmentNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptSpreadAssignmentNode, context: TypeScriptParserContext): void {
  const expressionNode = this.expressionNode;
  if (expressionNode instanceof TypeScriptBinaryExpressionNode && expressionNode.operatorNode instanceof TypeScriptEqualsNode)
    return;
  const targetNode = expressionNode.getTypeScriptUnparenthesizedExpression();
  if (targetNode instanceof TypeScriptObjectLiteralExpressionNode || targetNode instanceof TypeScriptArrayLiteralExpressionNode) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2501, expressionNode.span);
    if (targetNode === expressionNode)
      return;
  }
  expressionNode.validateTypeScriptReference(context, TypeScriptDiagnosticTemplates.TS2701, TypeScriptDiagnosticTemplates.TS2778);
};

TypeScriptSpreadAssignmentNode.prototype.isTypeScriptRestElement = function (this: TypeScriptSpreadAssignmentNode): boolean {
  return true;
};
