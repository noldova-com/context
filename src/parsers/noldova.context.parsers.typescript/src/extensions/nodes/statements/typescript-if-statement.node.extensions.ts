/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptIfStatementNode } from "../../../models/nodes/statements/typescript-if-statement.node.js";

TypeScriptIfStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptIfStatementNode): SourceSpan {
  return this.ifKeywordNode.span;
};
