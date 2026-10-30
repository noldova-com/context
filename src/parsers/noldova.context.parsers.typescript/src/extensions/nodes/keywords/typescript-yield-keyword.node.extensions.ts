/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptYieldKeywordNode } from "../../../models/nodes/keywords/typescript-yield-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptYieldKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptYieldKeywordNode): boolean {
  return true;
};

TypeScriptYieldKeywordNode.prototype.isTypeScriptIdentifier = function (this: TypeScriptYieldKeywordNode, context: TypeScriptParserContext): boolean {
  return !context.isYieldContext;
};

TypeScriptYieldKeywordNode.prototype.isTypeScriptYieldExpressionStart = function (
  this: TypeScriptYieldKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptYieldKeywordNode {
  return parser.context.isYieldContext || parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.canFollowTypeScriptUnscopedAwaitOrYield();
  });
};

TypeScriptYieldKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptYieldKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};
