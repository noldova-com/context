/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptAsExpressionNode } from "../../../models/nodes/expressions/typescript-as-expression.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAsKeywordNode.prototype.parseTypeScriptExport = function (this: TypeScriptAsKeywordNode, parser: TypeScriptSyntaxParser, exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[]): Node {
  return parser.parseNamespaceExportDeclaration(exportKeywordNode, this, modifierNodes);
};

TypeScriptAsKeywordNode.prototype.createTypeScriptTypeCheckExpression = function (this: TypeScriptAsKeywordNode, expressionNode: Node, span: SourceSpan,
  typeNode: Node, leadingTrivia: Node | undefined, trailingTrivia: Node | undefined): TypeScriptAsExpressionNode {
  return new TypeScriptAsExpressionNode(expressionNode, this, span, typeNode, leadingTrivia, trailingTrivia);
};

TypeScriptAsKeywordNode.prototype.isTypeScriptExportFormStart = function (this: TypeScriptAsKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptAsKeywordNode.prototype.canFollowTypeScriptExportModifier = function (this: TypeScriptAsKeywordNode): boolean {
  return false;
};
