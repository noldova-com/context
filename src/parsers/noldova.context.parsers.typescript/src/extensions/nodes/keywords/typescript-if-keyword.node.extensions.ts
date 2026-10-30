/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptIfKeywordNode } from "../../../models/nodes/keywords/typescript-if-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptIfKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptIfKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseIfStatement(this);
};

TypeScriptIfKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptIfKeywordNode): boolean {
  return true;
};
