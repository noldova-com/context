/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptSpreadElementNode } from "../../../models/nodes/expressions/typescript-spread-element.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptSpreadElementNode.prototype.markTypeScriptPattern = function (this: TypeScriptSpreadElementNode, context: TypeScriptParserContext): void {
  this.expressionNode.markTypeScriptPattern(context);
};

TypeScriptSpreadElementNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptSpreadElementNode, context: TypeScriptParserContext): void {
  this.expressionNode.validateTypeScriptDestructuringTarget(context);
};

TypeScriptSpreadElementNode.prototype.reportTypeScriptRestInitializer = function (this: TypeScriptSpreadElementNode, context: TypeScriptParserContext): void {
  if (this.expressionNode instanceof TypeScriptBinaryExpressionNode && this.expressionNode.operatorNode instanceof TypeScriptEqualsNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1186, this.expressionNode.operatorNode.span);
};

TypeScriptSpreadElementNode.prototype.isTypeScriptRestElement = function (this: TypeScriptSpreadElementNode): boolean {
  return true;
};
