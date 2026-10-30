/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptSatisfiesExpressionNode } from "../../../models/nodes/expressions/typescript-satisfies-expression.node.js";
import { TypeScriptSatisfiesKeywordNode } from "../../../models/nodes/keywords/typescript-satisfies-keyword.node.js";

TypeScriptSatisfiesKeywordNode.prototype.createTypeScriptTypeCheckExpression = function (this: TypeScriptSatisfiesKeywordNode, expressionNode: Node, span: SourceSpan,
  typeNode: Node, leadingTrivia: Node | undefined, trailingTrivia: Node | undefined): TypeScriptSatisfiesExpressionNode {
  return new TypeScriptSatisfiesExpressionNode(expressionNode, this, span, typeNode, leadingTrivia, trailingTrivia);
};
