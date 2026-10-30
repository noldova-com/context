/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptObjectKeywordNode } from "../../../models/nodes/keywords/typescript-object-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptObjectKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptObjectKeywordNode): boolean {
  return true;
};

TypeScriptObjectKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptObjectKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
