/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptStringKeywordNode } from "../../../models/nodes/keywords/typescript-string-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptStringKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptStringKeywordNode): boolean {
  return true;
};

TypeScriptStringKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptStringKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};

TypeScriptStringKeywordNode.prototype.stopsTypeScriptIndexSignatureAtItsParameter = function (this: TypeScriptStringKeywordNode): boolean {
  return false;
};
