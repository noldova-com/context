/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptModuleDeclarationKeywordNode } from "../../../models/nodes/keywords/typescript-module-declaration-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptModuleDeclarationKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptModuleDeclarationKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptModuleDeclarationKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptModuleDeclarationKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.isNamedModuleDeclarationStart();
};

TypeScriptModuleDeclarationKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptModuleDeclarationKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptDeclarationStart(parser)
    ? parser.parseModuleDeclaration(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};

TypeScriptModuleDeclarationKeywordNode.prototype.reportTypeScriptMissingSemicolon = function (this: TypeScriptModuleDeclarationKeywordNode, parser: TypeScriptSyntaxParser): void {
  parser.reportInvalidModuleName(this);
};
