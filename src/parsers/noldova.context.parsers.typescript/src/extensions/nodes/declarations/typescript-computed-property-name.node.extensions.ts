/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptComputedPropertyNameNode } from "../../../models/nodes/declarations/typescript-computed-property-name.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptComputedPropertyNameNode.prototype.getTypeScriptEffectivePropertyName = function (this: TypeScriptComputedPropertyNameNode, context: TypeScriptParserContext): string | undefined {
  const expressionNode = this.expressionNode;
  return expressionNode.isTypeScriptStringOrNumericLiteral() ? expressionNode.getTypeScriptEffectivePropertyName(context) : undefined;
};

TypeScriptComputedPropertyNameNode.prototype.reportTypeScriptCommaComputedName = function (this: TypeScriptComputedPropertyNameNode, context: TypeScriptParserContext): void {
  if (this.expressionNode instanceof TypeScriptBinaryExpressionNode && this.expressionNode.operatorNode instanceof TypeScriptCommaNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1171, this.expressionNode.span);
};
