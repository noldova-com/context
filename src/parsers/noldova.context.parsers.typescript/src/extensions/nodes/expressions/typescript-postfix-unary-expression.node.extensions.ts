/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptPostfixUnaryExpressionNode } from "../../../models/nodes/expressions/typescript-postfix-unary-expression.node.js";

TypeScriptPostfixUnaryExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptPostfixUnaryExpressionNode): SourceSpan {
  return this.operandNode.getTypeScriptFirstTokenSpan();
};
