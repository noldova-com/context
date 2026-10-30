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
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptShiftLeftNode } from "../../../models/nodes/operators/typescript-shift-left.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptShiftLeftNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptShiftLeftNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Shift;
};

TypeScriptShiftLeftNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptShiftLeftNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptShiftLeftNode.prototype.canStartTypeScriptGenericList = function (this: TypeScriptShiftLeftNode): boolean {
  return true;
};

TypeScriptShiftLeftNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptShiftLeftNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.tryParseInstantiationExpression(expressionNode);
};

TypeScriptShiftLeftNode.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: TypeScriptShiftLeftNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parseOptionalTypeArgumentSuffix(expressionNode, questionDotNode);
};
