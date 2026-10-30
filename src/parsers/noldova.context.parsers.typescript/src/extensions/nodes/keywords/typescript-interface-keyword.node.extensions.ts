/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptInterfaceKeywordNode } from "../../../models/nodes/keywords/typescript-interface-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptInterfaceKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptInterfaceKeywordNode): boolean {
  return true;
};

TypeScriptInterfaceKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptInterfaceKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  const isDeclaration = modifierNodes.length > 0 || this.isTypeScriptDeclarationStart(parser);
  return isDeclaration ? parser.parseInterfaceDeclaration(this, modifierNodes) : parser.parseExpressionOrLabeledStatement();
};

TypeScriptInterfaceKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptInterfaceKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptInterfaceKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptInterfaceKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.isTypeScriptIdentifier(parser.context);
  });
};

TypeScriptInterfaceKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptInterfaceKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};

TypeScriptInterfaceKeywordNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptInterfaceKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
