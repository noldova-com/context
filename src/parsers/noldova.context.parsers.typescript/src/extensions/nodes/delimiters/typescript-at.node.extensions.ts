/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAtNode } from "../../../models/nodes/delimiters/typescript-at.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAtNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptAtNode): boolean {
  return true;
};

TypeScriptAtNode.prototype.canStartTypeScriptPrimaryExpression = function (this: TypeScriptAtNode): boolean {
  return true;
};

TypeScriptAtNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptAtNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptAtNode.prototype.parseTypeScriptStatement = function (this: TypeScriptAtNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseDeclaration();
};

TypeScriptAtNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptAtNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseDecoratedClassExpression();
};

TypeScriptAtNode.prototype.canStartTypeScriptParameter = function (this: TypeScriptAtNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptAtNode.prototype.canStartTypeScriptClassMember = function (this: TypeScriptAtNode): boolean {
  return true;
};

TypeScriptAtNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptAtNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptAtNode.prototype.canFollowTypeScriptExportKeyword = function (this: TypeScriptAtNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
