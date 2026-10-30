/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNumberKeywordNode } from "../../../models/nodes/keywords/typescript-number-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptNumberKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptNumberKeywordNode): boolean {
  return true;
};

TypeScriptNumberKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptNumberKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};

TypeScriptNumberKeywordNode.prototype.stopsTypeScriptIndexSignatureAtItsParameter = function (this: TypeScriptNumberKeywordNode): boolean {
  return false;
};
