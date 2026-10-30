/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssertsKeywordNode } from "../../../models/nodes/keywords/typescript-asserts-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptAssertsKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptAssertsKeywordNode, parser: TypeParser): Node {
  return parser.parseAssertionOrReferenceType(this);
};
