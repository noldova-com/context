/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptWhileStatementNode } from "../../../models/nodes/statements/typescript-while-statement.node.js";

TypeScriptWhileStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptWhileStatementNode): SourceSpan {
  return this.whileKeywordNode.span;
};
