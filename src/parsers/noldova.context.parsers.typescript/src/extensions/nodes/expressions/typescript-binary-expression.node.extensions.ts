/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBindingElementNode } from "../../../models/nodes/declarations/typescript-binding-element.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptQuestionQuestionNode } from "../../../models/nodes/operators/typescript-question-question.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptBinaryExpressionNode.prototype.toTypeScriptBindingElement = function (this: TypeScriptBinaryExpressionNode): TypeScriptBindingElementNode | undefined {
  if (!(this.operatorNode instanceof TypeScriptEqualsNode))
    return undefined;

  const nameNode = this.leftNode.toTypeScriptBindingName();
  if (Object.isUndefined(nameNode))
    return undefined;

  return new TypeScriptBindingElementNode(this.span, nameNode, undefined, undefined, undefined, this.operatorNode, this.rightNode, this.leadingTrivia, this.trailingTrivia);
};

TypeScriptBinaryExpressionNode.prototype.getTypeScriptLogicalOperatorNode = function (this: TypeScriptBinaryExpressionNode): ValueNode | undefined {
  return this.operatorNode.isTypeScriptLogicalOperator() ? this.operatorNode : undefined;
};

TypeScriptBinaryExpressionNode.prototype.getTypeScriptNullishOperatorNode = function (this: TypeScriptBinaryExpressionNode): ValueNode | undefined {
  return this.operatorNode instanceof TypeScriptQuestionQuestionNode ? this.operatorNode : undefined;
};

TypeScriptBinaryExpressionNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptBinaryExpressionNode, context: TypeScriptParserContext): void {
  this.operatorNode.validateTypeScriptBinaryOperands(context, this.leftNode, this.rightNode);
};

TypeScriptBinaryExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptBinaryExpressionNode): boolean {
  let node: Node = this;
  while (node instanceof TypeScriptBinaryExpressionNode) {
    const operatorNode = node.operatorNode;
    if (!operatorNode.passesTypeScriptContextualTypeToRightOperand())
      return false;
    if (node.rightNode.readsTypeScriptContextualType())
      return true;
    if (!operatorNode.passesTypeScriptContextualTypeToLeftOperand())
      return false;
    node = node.leftNode;
  }
  return node.readsTypeScriptContextualType();
};

TypeScriptBinaryExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptBinaryExpressionNode): Node {
  return this.leftNode;
};

TypeScriptBinaryExpressionNode.prototype.markTypeScriptPattern = function (this: TypeScriptBinaryExpressionNode, context: TypeScriptParserContext): void {
  if (this.operatorNode instanceof TypeScriptEqualsNode)
    this.leftNode.markTypeScriptPattern(context);
};

TypeScriptBinaryExpressionNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptBinaryExpressionNode, context: TypeScriptParserContext): void {
  if (!(this.operatorNode instanceof TypeScriptEqualsNode))
    this.validateTypeScriptReference(context, TypeScriptDiagnosticTemplates.TS2364, TypeScriptDiagnosticTemplates.TS2779);
};
