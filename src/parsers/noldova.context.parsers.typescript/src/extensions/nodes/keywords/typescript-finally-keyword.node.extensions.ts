/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptFinallyKeywordNode } from "../../../models/nodes/keywords/typescript-finally-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptFinallyKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptFinallyKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTryStatement();
};

TypeScriptFinallyKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptFinallyKeywordNode): boolean {
  return true;
};
