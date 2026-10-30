/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptOpenBracketNode.prototype.canStartTypeScriptBindingName = function (this: TypeScriptOpenBracketNode): boolean {
  return true;
};

TypeScriptOpenBracketNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptOpenBracketNode): boolean {
  return true;
};

TypeScriptOpenBracketNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptOpenBracketNode): boolean {
  return true;
};

TypeScriptOpenBracketNode.prototype.getTypeScriptClosingDelimiterType = function (this: TypeScriptOpenBracketNode): typeof TypeScriptCloseBracketNode {
  return TypeScriptCloseBracketNode;
};

TypeScriptOpenBracketNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptOpenBracketNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseArrayLiteralExpression(this);
};

TypeScriptOpenBracketNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptOpenBracketNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  if (parser.context.isDecoratorContext)
    return undefined;
  return parser.parseElementAccessExpression(expressionNode, this);
};

TypeScriptOpenBracketNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptOpenBracketNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseElementAccessExpression(expressionNode, this, questionDotNode);
};

TypeScriptOpenBracketNode.prototype.canStartTypeScriptType = function (this: TypeScriptOpenBracketNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptOpenBracketNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptOpenBracketNode): boolean {
  return true;
};

TypeScriptOpenBracketNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptOpenBracketNode, parser: TypeParser): Node {
  return parser.parseTupleType(this);
};
