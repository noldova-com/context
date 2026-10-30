/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDoStatementNode } from "../../../models/nodes/statements/typescript-do-statement.node.js";

TypeScriptDoStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptDoStatementNode): SourceSpan {
  return this.doKeywordNode.span;
};
