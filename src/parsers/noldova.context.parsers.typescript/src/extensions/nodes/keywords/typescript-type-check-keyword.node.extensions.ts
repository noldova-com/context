/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import type { TypeScriptTypeCheckExpressionNode } from "../../../models/nodes/expressions/typescript-type-check-expression.node.js";
import { TypeScriptTypeCheckKeywordNode } from "../../../models/nodes/keywords/typescript-type-check-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

declare module "../../../models/nodes/keywords/typescript-type-check-keyword.node.js" {
  interface TypeScriptTypeCheckKeywordNode {
    createTypeScriptTypeCheckExpression(expressionNode: Node, span: SourceSpan, typeNode: Node, leadingTrivia: Node | undefined,
      trailingTrivia: Node | undefined): TypeScriptTypeCheckExpressionNode;
  }
}

TypeScriptTypeCheckKeywordNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptTypeCheckKeywordNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptTypeCheckKeywordNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptTypeCheckKeywordNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptTypeCheckKeywordNode.prototype.parseTypeScriptBinaryExpression = function (
  this: TypeScriptTypeCheckKeywordNode,
  parser: TypeScriptSyntaxParser,
  leftNode: Node,
  minimumPrecedence: number): Node | undefined {
  if (this.getTypeScriptPrecedence() < minimumPrecedence || parser.hasPrecedingLineBreak())
    return undefined;

  parser.advance();
  const typeNode = parser.parseType();
  const span = parser.typescriptLexer.reader.createSpan(leftNode.span, typeNode.span);
  return this.createTypeScriptTypeCheckExpression(leftNode, span, typeNode, leftNode.leadingTrivia, typeNode.trailingTrivia);
};
