/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptClassExpressionNode } from "../../../models/nodes/expressions/typescript-class-expression.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptClassExpressionNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptClassExpressionNode, context: TypeScriptParserContext): void {
  this.nameNode?.reportTypeScriptReservedTypeName(context, TypeScriptDiagnosticTemplates.TS2414);
  this.reportTypeScriptHeritageClauses(context);
};

TypeScriptClassExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptClassExpressionNode): boolean {
  return true;
};

TypeScriptClassExpressionNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptClassExpressionNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptClassExpressionNode.prototype.getTypeScriptDecoratorSupport = function (this: TypeScriptClassExpressionNode): TypeScriptDecoratorSupport {
  return TypeScriptDecoratorSupport.Supported;
};

TypeScriptClassExpressionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptClassExpressionNode): boolean {
  return true;
};
