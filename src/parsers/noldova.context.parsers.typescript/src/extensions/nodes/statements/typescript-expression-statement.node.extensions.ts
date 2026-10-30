/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptExpressionStatementNode } from "../../../models/nodes/statements/typescript-expression-statement.node.js";

TypeScriptExpressionStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptExpressionStatementNode): SourceSpan {
  return this.expressionNode.getTypeScriptFirstTokenSpan();
};
