/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSwitchKeywordNode } from "../../../models/nodes/keywords/typescript-switch-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptSwitchKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptSwitchKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseSwitchStatement(this);
};

TypeScriptSwitchKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptSwitchKeywordNode): boolean {
  return true;
};
