/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptLessThanNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptLessThanNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptLessThanNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptLessThanNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptLessThanNode.prototype.canStartTypeScriptSignature = function (this: TypeScriptLessThanNode): boolean {
  return true;
};

TypeScriptLessThanNode.prototype.canStartTypeScriptGenericList = function (this: TypeScriptLessThanNode): boolean {
  return true;
};

TypeScriptLessThanNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptLessThanNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTypeAssertionExpression(this);
};

TypeScriptLessThanNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptLessThanNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.tryParseInstantiationExpression(expressionNode);
};

TypeScriptLessThanNode.prototype.tryParseTypeScriptAssignmentStart = function (
  this: TypeScriptLessThanNode,
  parser: TypeScriptSyntaxParser): Node | undefined {
  return parser.tryParseArrowFunction();
};

TypeScriptLessThanNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptLessThanNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseOptionalTypeArgumentSuffix(expressionNode, questionDotNode);
};

TypeScriptLessThanNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptLessThanNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17007, expressionNode.span);
};

TypeScriptLessThanNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptLessThanNode): boolean {
  return false;
};
