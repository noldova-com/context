/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptOpenParenthesisNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptOpenParenthesisNode): boolean {
  return true;
};

TypeScriptOpenParenthesisNode.prototype.canStartTypeScriptSignature = function (this: TypeScriptOpenParenthesisNode): boolean {
  return true;
};

TypeScriptOpenParenthesisNode.prototype.getTypeScriptClosingDelimiterType = function (this: TypeScriptOpenParenthesisNode): typeof TypeScriptCloseParenthesisNode {
  return TypeScriptCloseParenthesisNode;
};

TypeScriptOpenParenthesisNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptOpenParenthesisNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseParenthesizedExpression(this);
};

TypeScriptOpenParenthesisNode.prototype.parseTypeScriptLeftHandSideSuffix = function (
  this: TypeScriptOpenParenthesisNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.parseCallExpression(expressionNode, this);
};

TypeScriptOpenParenthesisNode.prototype.tryParseTypeScriptAssignmentStart = function (
  this: TypeScriptOpenParenthesisNode,
  parser: TypeScriptSyntaxParser): Node | undefined {
  return parser.tryParseParenthesizedExpressionOrArrowFunction();
};

TypeScriptOpenParenthesisNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptOpenParenthesisNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseCallExpression(expressionNode, this, questionDotNode);
};

TypeScriptOpenParenthesisNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptOpenParenthesisNode): boolean {
  return true;
};

TypeScriptOpenParenthesisNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptOpenParenthesisNode): boolean {
  return true;
};

TypeScriptOpenParenthesisNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptOpenParenthesisNode, parser: TypeParser): Node {
  return parser.parseParenthesizedType(this);
};

TypeScriptOpenParenthesisNode.prototype.canStartTypeScriptParameter = function (this: TypeScriptOpenParenthesisNode, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};
