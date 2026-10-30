/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptTryStatementNode } from "../../../models/nodes/statements/typescript-try-statement.node.js";

TypeScriptTryStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptTryStatementNode): SourceSpan {
  return this.tryKeywordNode?.span ?? this.span;
};
