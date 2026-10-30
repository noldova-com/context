/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptNewExpressionNode } from "../../../models/nodes/expressions/typescript-new-expression.node.js";

TypeScriptNewExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptNewExpressionNode): boolean {
  return true;
};

TypeScriptNewExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptNewExpressionNode): SourceSpan {
  return this.newKeywordNode.span;
};

TypeScriptNewExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptNewExpressionNode): SourceSpan | undefined {
  const startNode = this.typeArgumentListNode ?? this.argumentListNode;
  return Object.isUndefined(startNode) ? undefined : new SourceSpan(startNode.span.startOffset, this.span.endOffset - startNode.span.startOffset);
};
