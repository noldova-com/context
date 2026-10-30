/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptArrowNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptArrowNode): boolean {
  return true;
};

TypeScriptArrowNode.prototype.tryParseTypeScriptAssignmentStart = function (this: TypeScriptArrowNode, parser: TypeScriptSyntaxParser): Node | undefined {
  return parser.parseArrowFunctionDefinite();
};
