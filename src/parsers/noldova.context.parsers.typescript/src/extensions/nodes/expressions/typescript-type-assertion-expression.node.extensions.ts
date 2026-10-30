/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptTypeAssertionExpressionNode } from "../../../models/nodes/expressions/typescript-type-assertion-expression.node.js";

TypeScriptTypeAssertionExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptTypeAssertionExpressionNode): SourceSpan {
  return this.lessThanNode.span;
};

TypeScriptTypeAssertionExpressionNode.prototype.getTypeScriptOuterExpressionOperand = function (this: TypeScriptTypeAssertionExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptTypeAssertionExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptTypeAssertionExpressionNode): SourceSpan | undefined {
  return this.typeNode.isTypeScriptConstReference() ? undefined : this.span;
};

TypeScriptTypeAssertionExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptTypeAssertionExpressionNode): boolean {
  return this.typeNode.isTypeScriptConstReference() && this.expressionNode.readsTypeScriptContextualType();
};
