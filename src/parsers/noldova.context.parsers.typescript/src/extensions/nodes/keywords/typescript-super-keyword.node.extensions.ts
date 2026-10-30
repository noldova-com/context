/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptSuperKeywordNode } from "../../../models/nodes/keywords/typescript-super-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptSuperKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptSuperKeywordNode): boolean {
  return true;
};

TypeScriptSuperKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptSuperKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptSuperKeywordNode {
  parser.advance();
  return this;
};

TypeScriptSuperKeywordNode.prototype.parseTypeScriptMemberExpression = function (this: TypeScriptSuperKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseSuperExpression(this);
};

TypeScriptSuperKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptSuperKeywordNode): boolean {
  return true;
};

TypeScriptSuperKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptSuperKeywordNode): boolean {
  return true;
};

TypeScriptSuperKeywordNode.prototype.isTypeScriptQuickTypedCallee = function (this: TypeScriptSuperKeywordNode): boolean {
  return false;
};
