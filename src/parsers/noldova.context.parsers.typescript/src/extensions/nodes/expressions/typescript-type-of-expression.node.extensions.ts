/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptTypeOfExpressionNode } from "../../../models/nodes/expressions/typescript-type-of-expression.node.js";

TypeScriptTypeOfExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptTypeOfExpressionNode): SourceSpan {
  return this.typeOfKeywordNode.span;
};
