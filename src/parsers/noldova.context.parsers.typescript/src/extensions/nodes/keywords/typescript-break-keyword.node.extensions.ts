/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptBreakKeywordNode } from "../../../models/nodes/keywords/typescript-break-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptBreakKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptBreakKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseBreakStatement(this);
};

TypeScriptBreakKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptBreakKeywordNode): boolean {
  return true;
};
