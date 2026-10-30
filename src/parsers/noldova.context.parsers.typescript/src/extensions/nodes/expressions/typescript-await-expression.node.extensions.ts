/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptAwaitExpressionNode } from "../../../models/nodes/expressions/typescript-await-expression.node.js";

TypeScriptAwaitExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptAwaitExpressionNode): SourceSpan {
  return this.awaitKeywordNode.span;
};

TypeScriptAwaitExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptAwaitExpressionNode): SourceSpan | undefined {
  return this.expressionNode.getTypeScriptQuickTypeSkippedSpan();
};

TypeScriptAwaitExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptAwaitExpressionNode): boolean {
  return this.expressionNode.readsTypeScriptContextualType();
};
