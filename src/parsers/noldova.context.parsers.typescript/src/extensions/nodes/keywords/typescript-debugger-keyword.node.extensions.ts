/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDebuggerKeywordNode } from "../../../models/nodes/keywords/typescript-debugger-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDebuggerKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptDebuggerKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseDebuggerStatement(this);
};

TypeScriptDebuggerKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptDebuggerKeywordNode): boolean {
  return true;
};
