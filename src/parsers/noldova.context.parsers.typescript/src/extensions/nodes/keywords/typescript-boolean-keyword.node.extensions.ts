/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptBooleanKeywordNode } from "../../../models/nodes/keywords/typescript-boolean-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptBooleanKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptBooleanKeywordNode): boolean {
  return true;
};

TypeScriptBooleanKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptBooleanKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
