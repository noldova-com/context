/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSymbolKeywordNode } from "../../../models/nodes/keywords/typescript-symbol-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptSymbolKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptSymbolKeywordNode): boolean {
  return true;
};

TypeScriptSymbolKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptSymbolKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};

TypeScriptSymbolKeywordNode.prototype.stopsTypeScriptIndexSignatureAtItsParameter = function (this: TypeScriptSymbolKeywordNode): boolean {
  return false;
};
