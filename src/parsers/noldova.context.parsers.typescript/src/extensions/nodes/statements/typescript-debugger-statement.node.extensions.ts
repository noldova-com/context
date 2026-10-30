/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDebuggerStatementNode } from "../../../models/nodes/statements/typescript-debugger-statement.node.js";

TypeScriptDebuggerStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptDebuggerStatementNode): SourceSpan {
  return this.debuggerKeywordNode.span;
};
