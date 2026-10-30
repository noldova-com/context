/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContinueKeywordNode } from "../../../models/nodes/keywords/typescript-continue-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptContinueKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptContinueKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseContinueStatement(this);
};

TypeScriptContinueKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptContinueKeywordNode): boolean {
  return true;
};
