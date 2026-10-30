/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptVarKeywordNode } from "../../../models/nodes/keywords/typescript-var-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptVarKeywordNode.prototype.isTypeScriptVariableDeclarationKeyword = function (this: TypeScriptVarKeywordNode): this is TypeScriptVarKeywordNode {
  return true;
};

TypeScriptVarKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptVarKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return parser.parseVariableStatement(this, modifierNodes);
};

TypeScriptVarKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptVarKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};
