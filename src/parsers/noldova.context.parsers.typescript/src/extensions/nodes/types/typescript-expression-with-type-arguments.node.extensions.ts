/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptParserException } from "../../../exceptions/typescript-parser.exception.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptExpressionWithTypeArgumentsNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptExpressionWithTypeArgumentsNode): boolean {
  return true;
};

TypeScriptExpressionWithTypeArgumentsNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptExpressionWithTypeArgumentsNode): Node {
  return this.expressionNode;
};

TypeScriptExpressionWithTypeArgumentsNode.prototype.getTypeScriptDecoratorChainOperand = function (this: TypeScriptExpressionWithTypeArgumentsNode): Node {
  return this.expressionNode;
};

TypeScriptExpressionWithTypeArgumentsNode.prototype.getTypeScriptDecoratorLinkError = function (this: TypeScriptExpressionWithTypeArgumentsNode,
  _isCallAllowed: boolean): Node | undefined {
  return undefined;
};

TypeScriptExpressionWithTypeArgumentsNode.prototype.keepsTypeScriptDecoratorCallAllowed = function (this: TypeScriptExpressionWithTypeArgumentsNode): boolean {
  return true;
};

TypeScriptExpressionWithTypeArgumentsNode.prototype.reportTypeScriptInstantiationAccess = function (this: TypeScriptExpressionWithTypeArgumentsNode, parser: TypeScriptSyntaxParser): void {
  if (Object.isUndefined(this.typeArgumentListNode))
    throw new TypeScriptParserException(Resources.instantiationAccessWithoutTypeArguments);

  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1477, this.typeArgumentListNode.span);
};
