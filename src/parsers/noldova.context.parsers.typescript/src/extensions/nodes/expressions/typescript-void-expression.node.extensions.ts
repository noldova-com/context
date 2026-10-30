/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptVoidExpressionNode } from "../../../models/nodes/expressions/typescript-void-expression.node.js";

TypeScriptVoidExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptVoidExpressionNode): SourceSpan {
  return this.voidKeywordNode.span;
};
