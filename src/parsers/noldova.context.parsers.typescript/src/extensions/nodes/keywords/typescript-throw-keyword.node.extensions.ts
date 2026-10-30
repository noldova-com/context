/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptThrowKeywordNode } from "../../../models/nodes/keywords/typescript-throw-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptThrowKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptThrowKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseThrowStatement(this);
};

TypeScriptThrowKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptThrowKeywordNode): boolean {
  return true;
};
