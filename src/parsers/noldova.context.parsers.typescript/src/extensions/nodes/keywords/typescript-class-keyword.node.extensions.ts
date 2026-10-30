/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptClassKeywordNode } from "../../../models/nodes/keywords/typescript-class-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptClassKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptClassKeywordNode): boolean {
  return true;
};

TypeScriptClassKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptClassKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseClassExpression(this);
};

TypeScriptClassKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptClassKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return parser.parseClassDeclaration(this, modifierNodes);
};

TypeScriptClassKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptClassKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptClassKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptClassKeywordNode): boolean {
  return true;
};

TypeScriptClassKeywordNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptClassKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
