/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPropertyAccessExpressionNode } from "../../../models/nodes/expressions/typescript-property-access-expression.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptPropertyAccessExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptPropertyAccessExpressionNode): boolean {
  return true;
};

TypeScriptPropertyAccessExpressionNode.prototype.validateTypeScriptOptionalChain = function (
  this: TypeScriptPropertyAccessExpressionNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptPrivateIdentifierNode)
    context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18030, this.nameNode.span);
};

TypeScriptPropertyAccessExpressionNode.prototype.getTypeScriptDecoratorChainOperand = function (this: TypeScriptPropertyAccessExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptPropertyAccessExpressionNode.prototype.getTypeScriptDecoratorLinkError = function (this: TypeScriptPropertyAccessExpressionNode,
  _isCallAllowed: boolean): Node | undefined {
  return this.accessNode instanceof TypeScriptQuestionDotNode ? this.accessNode : undefined;
};

TypeScriptPropertyAccessExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptPropertyAccessExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptPropertyAccessExpressionNode.prototype.isTypeScriptReference = function (this: TypeScriptPropertyAccessExpressionNode): boolean {
  return true;
};

TypeScriptPropertyAccessExpressionNode.prototype.getTypeScriptChainOperand = function (this: TypeScriptPropertyAccessExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptPropertyAccessExpressionNode.prototype.hasTypeScriptQuestionDot = function (this: TypeScriptPropertyAccessExpressionNode): boolean {
  return this.accessNode instanceof TypeScriptQuestionDotNode;
};

TypeScriptPropertyAccessExpressionNode.prototype.isTypeScriptAccessExpression = function (this: TypeScriptPropertyAccessExpressionNode): boolean {
  return true;
};
