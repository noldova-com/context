/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptWhileKeywordNode } from "../../../models/nodes/keywords/typescript-while-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptWhileKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptWhileKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseWhileStatement(this);
};

TypeScriptWhileKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptWhileKeywordNode): boolean {
  return true;
};

TypeScriptWhileKeywordNode.prototype.isTypeScriptIterationStart = function (this: TypeScriptWhileKeywordNode): boolean {
  return true;
};
