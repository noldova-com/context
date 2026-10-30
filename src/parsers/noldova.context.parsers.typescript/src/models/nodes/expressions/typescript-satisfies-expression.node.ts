/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSatisfiesKeywordNode } from "../keywords/typescript-satisfies-keyword.node.js";
import { TypeScriptTypeCheckExpressionNode } from "./typescript-type-check-expression.node.js";

export class TypeScriptSatisfiesExpressionNode extends TypeScriptTypeCheckExpressionNode {
  public readonly satisfiesKeywordNode: TypeScriptSatisfiesKeywordNode;

  public constructor(
    expressionNode: Node,
    satisfiesKeywordNode: TypeScriptSatisfiesKeywordNode,
    span: SourceSpan,
    typeNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(expressionNode, span, typeNode, leadingTrivia, trailingTrivia);
    this.satisfiesKeywordNode = satisfiesKeywordNode;
  }
}
