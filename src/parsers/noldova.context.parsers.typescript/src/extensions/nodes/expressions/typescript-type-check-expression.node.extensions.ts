/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import { TypeScriptTypeCheckExpressionNode } from "../../../models/nodes/expressions/typescript-type-check-expression.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTypeCheckExpressionNode.prototype.endsTypeScriptBinaryExpression = function (this: TypeScriptTypeCheckExpressionNode, parser: TypeScriptSyntaxParser,
  lastOperandNode: Node): boolean {
  return lastOperandNode instanceof TypeScriptBinaryExpressionNode
    && parser.currentNode.getTypeScriptPrecedence() > lastOperandNode.operatorNode.getTypeScriptPrecedence();
};

TypeScriptTypeCheckExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptTypeCheckExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptTypeCheckExpressionNode.prototype.getTypeScriptOuterExpressionOperand = function (this: TypeScriptTypeCheckExpressionNode): Node {
  return this.expressionNode;
};
