/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptIdentifierNode } from "../../../models/nodes/identifiers/typescript-identifier.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptGlobalKeywordNode } from "../../../models/nodes/keywords/typescript-global-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptGlobalKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptGlobalKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptGlobalKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptGlobalKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptOpenBraceNode || parser.currentNode instanceof TypeScriptIdentifierNode || parser.currentNode instanceof TypeScriptExportKeywordNode;
  });
};

TypeScriptGlobalKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptGlobalKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptDeclarationStart(parser)
    ? parser.parseModuleDeclaration(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};
