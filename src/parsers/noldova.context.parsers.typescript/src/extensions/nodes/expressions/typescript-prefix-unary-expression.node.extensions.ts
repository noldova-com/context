/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptPrefixUnaryExpressionNode } from "../../../models/nodes/expressions/typescript-prefix-unary-expression.node.js";

TypeScriptPrefixUnaryExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptPrefixUnaryExpressionNode): SourceSpan {
  return this.operatorNode.span;
};
