/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptBigIntKeywordNode } from "../../../models/nodes/keywords/typescript-big-int-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptBigIntKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptBigIntKeywordNode): boolean {
  return true;
};

TypeScriptBigIntKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptBigIntKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
