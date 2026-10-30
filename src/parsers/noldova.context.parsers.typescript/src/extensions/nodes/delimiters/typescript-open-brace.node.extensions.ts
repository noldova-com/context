/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../../models/nodes/keywords/typescript-implements-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptOpenBraceNode.prototype.canStartTypeScriptBindingName = function (this: TypeScriptOpenBraceNode): boolean {
  return true;
};

TypeScriptOpenBraceNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptOpenBraceNode): boolean {
  return true;
};

TypeScriptOpenBraceNode.prototype.canStartTypeScriptHeritageExpression = function (this: TypeScriptOpenBraceNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    const first = parser.currentNode;
    if (!(first instanceof TypeScriptCloseBraceNode))
      return true;
    parser.advance();
    const node = parser.currentNode;
    return node instanceof TypeScriptCommaNode || node instanceof TypeScriptOpenBraceNode || node instanceof TypeScriptExtendsKeywordNode || node instanceof TypeScriptImplementsKeywordNode;
  });
};

TypeScriptOpenBraceNode.prototype.canFollowTypeScriptModifier = function (this: TypeScriptOpenBraceNode): boolean {
  return true;
};

TypeScriptOpenBraceNode.prototype.getTypeScriptClosingDelimiterType = function (this: TypeScriptOpenBraceNode): typeof TypeScriptCloseBraceNode {
  return TypeScriptCloseBraceNode;
};

TypeScriptOpenBraceNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptOpenBraceNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseObjectLiteralExpression(this);
};

TypeScriptOpenBraceNode.prototype.parseTypeScriptStatement = function (this: TypeScriptOpenBraceNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseBlock(this);
};

TypeScriptOpenBraceNode.prototype.canStartTypeScriptType = function (this: TypeScriptOpenBraceNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptOpenBraceNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptOpenBraceNode): boolean {
  return true;
};

TypeScriptOpenBraceNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptOpenBraceNode, parser: TypeParser): Node {
  return parser.parseTypeLiteral(this);
};

TypeScriptOpenBraceNode.prototype.isTypeScriptExportClauseStart = function (this: TypeScriptOpenBraceNode): boolean {
  return true;
};
