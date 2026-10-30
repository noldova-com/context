/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDoKeywordNode } from "../../../models/nodes/keywords/typescript-do-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDoKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptDoKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseDoStatement(this);
};

TypeScriptDoKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptDoKeywordNode): boolean {
  return true;
};

TypeScriptDoKeywordNode.prototype.isTypeScriptIterationStart = function (this: TypeScriptDoKeywordNode): boolean {
  return true;
};
