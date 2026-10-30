/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptFunctionKeywordNode } from "../../../models/nodes/keywords/typescript-function-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptFunctionKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptFunctionKeywordNode): boolean {
  return true;
};

TypeScriptFunctionKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptFunctionKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseFunctionExpression();
};

TypeScriptFunctionKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptFunctionKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return parser.parseFunctionDeclaration(modifierNodes);
};

TypeScriptFunctionKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptFunctionKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptFunctionKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptFunctionKeywordNode): boolean {
  return true;
};

TypeScriptFunctionKeywordNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptFunctionKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
