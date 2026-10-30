/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTemplateHeadNode.prototype.isTypeScriptTemplateStart = function (this: TypeScriptTemplateHeadNode): this is TypeScriptTemplateHeadNode {
  return true;
};

TypeScriptTemplateHeadNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptTemplateHeadNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTemplateExpression(this);
};

TypeScriptTemplateHeadNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptTemplateHeadNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.parseTaggedTemplateExpression(expressionNode, this);
};

TypeScriptTemplateHeadNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptTemplateHeadNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseTaggedTemplateExpression(expressionNode, this, questionDotNode);
};

TypeScriptTemplateHeadNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptTemplateHeadNode): boolean {
  return true;
};

TypeScriptTemplateHeadNode.prototype.canStartTypeScriptType = function (this: TypeScriptTemplateHeadNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptTemplateHeadNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptTemplateHeadNode): boolean {
  return true;
};

TypeScriptTemplateHeadNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptTemplateHeadNode, parser: TypeParser): Node {
  return parser.parseTemplateLiteralType(this);
};
