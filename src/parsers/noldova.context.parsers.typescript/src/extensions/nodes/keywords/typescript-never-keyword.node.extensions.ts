/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNeverKeywordNode } from "../../../models/nodes/keywords/typescript-never-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptNeverKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptNeverKeywordNode): boolean {
  return true;
};

TypeScriptNeverKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptNeverKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
