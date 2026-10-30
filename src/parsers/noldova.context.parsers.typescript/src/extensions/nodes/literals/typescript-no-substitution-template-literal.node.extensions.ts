/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.isTypeScriptTemplateStart = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): this is TypeScriptNoSubstitutionTemplateLiteralNode {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptNoSubstitutionTemplateLiteralNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTemplateExpression(this);
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptNoSubstitutionTemplateLiteralNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.parseTaggedTemplateExpression(expressionNode, this);
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptNoSubstitutionTemplateLiteralNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseTaggedTemplateExpression(expressionNode, this, questionDotNode);
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptNoSubstitutionTemplateLiteralNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.isTypeScriptStringOrNumericLiteral = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};

TypeScriptNoSubstitutionTemplateLiteralNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptNoSubstitutionTemplateLiteralNode): boolean {
  return true;
};
