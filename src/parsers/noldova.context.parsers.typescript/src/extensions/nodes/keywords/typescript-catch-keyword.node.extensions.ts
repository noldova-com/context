/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCatchKeywordNode } from "../../../models/nodes/keywords/typescript-catch-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptCatchKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptCatchKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTryStatement();
};

TypeScriptCatchKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptCatchKeywordNode): boolean {
  return true;
};
