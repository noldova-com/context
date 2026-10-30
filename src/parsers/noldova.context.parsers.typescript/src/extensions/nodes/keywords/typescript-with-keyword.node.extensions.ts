/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptWithKeywordNode } from "../../../models/nodes/keywords/typescript-with-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptWithKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptWithKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseWithStatement(this);
};

TypeScriptWithKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptWithKeywordNode): boolean {
  return true;
};
