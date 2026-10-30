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
import { TypeScriptGreaterThanNode } from "../../../models/nodes/operators/typescript-greater-than.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptGreaterThanNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptGreaterThanNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptGreaterThanNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptGreaterThanNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptGreaterThanNode.prototype.reLexTypeScriptBinaryOperator = function (this: TypeScriptGreaterThanNode, parser: TypeScriptSyntaxParser): void {
  if (!this.isTypeScriptSingleGreaterThan(parser))
    parser.reLexGreaterThan();
};

TypeScriptGreaterThanNode.prototype.isTypeScriptSingleGreaterThan = function (this: TypeScriptGreaterThanNode, parser: TypeScriptSyntaxParser): boolean {
  const reader = parser.typescriptLexer.reader;
  return !reader.startsWith(Resources.greaterThan) && !reader.startsWith(Resources.equals);
};

TypeScriptGreaterThanNode.prototype.parseTypeScriptBinaryExpression = function (
  this: TypeScriptGreaterThanNode,
  parser: TypeScriptSyntaxParser,
  leftNode: Node,
  minimumPrecedence: number): Node | undefined {
  this.reLexTypeScriptBinaryOperator(parser);
  return parser.parseBinaryOperator(parser.currentNode, leftNode, minimumPrecedence);
};

TypeScriptGreaterThanNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptGreaterThanNode): boolean {
  return false;
};
