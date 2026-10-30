/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptImplementsKeywordNode } from "../../../models/nodes/keywords/typescript-implements-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptImplementsKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptImplementsKeywordNode): boolean {
  return true;
};

TypeScriptImplementsKeywordNode.prototype.canStartTypeScriptHeritageExpression = function (this: TypeScriptImplementsKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.currentNode.canStartTypeScriptExpression(parser);
  });
};

TypeScriptImplementsKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptImplementsKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};
