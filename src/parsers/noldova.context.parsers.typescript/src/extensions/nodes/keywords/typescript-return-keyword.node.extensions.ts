/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptReturnKeywordNode } from "../../../models/nodes/keywords/typescript-return-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptReturnKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptReturnKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseReturnStatement(this);
};

TypeScriptReturnKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptReturnKeywordNode): boolean {
  return true;
};
