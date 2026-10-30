/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAnyKeywordNode } from "../../../models/nodes/keywords/typescript-any-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptAnyKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptAnyKeywordNode): boolean {
  return true;
};

TypeScriptAnyKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptAnyKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
