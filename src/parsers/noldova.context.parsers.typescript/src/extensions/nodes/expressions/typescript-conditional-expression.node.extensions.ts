/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptConditionalExpressionNode } from "../../../models/nodes/expressions/typescript-conditional-expression.node.js";

TypeScriptConditionalExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptConditionalExpressionNode): SourceSpan {
  return this.conditionNode.getTypeScriptFirstTokenSpan();
};

TypeScriptConditionalExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptConditionalExpressionNode): boolean {
  return this.trueExpressionNode.readsTypeScriptContextualType() || this.falseExpressionNode.readsTypeScriptContextualType();
};
