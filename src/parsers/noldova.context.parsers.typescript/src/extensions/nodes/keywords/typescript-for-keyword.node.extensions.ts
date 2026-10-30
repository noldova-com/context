/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptForKeywordNode } from "../../../models/nodes/keywords/typescript-for-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptForKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptForKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseForStatement(this);
};

TypeScriptForKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptForKeywordNode): boolean {
  return true;
};

TypeScriptForKeywordNode.prototype.isTypeScriptIterationStart = function (this: TypeScriptForKeywordNode): boolean {
  return true;
};
