/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTryKeywordNode } from "../../../models/nodes/keywords/typescript-try-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTryKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptTryKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTryStatement(this);
};

TypeScriptTryKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptTryKeywordNode): boolean {
  return true;
};
