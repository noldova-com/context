/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptUndefinedKeywordNode } from "../../../models/nodes/keywords/typescript-undefined-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptUndefinedKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptUndefinedKeywordNode): boolean {
  return true;
};

TypeScriptUndefinedKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptUndefinedKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
