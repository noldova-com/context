/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptUnknownKeywordNode } from "../../../models/nodes/keywords/typescript-unknown-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptUnknownKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptUnknownKeywordNode): boolean {
  return true;
};

TypeScriptUnknownKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptUnknownKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
