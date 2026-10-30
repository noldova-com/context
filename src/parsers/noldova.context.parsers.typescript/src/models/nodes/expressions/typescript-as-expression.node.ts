/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptAsKeywordNode } from "../keywords/typescript-as-keyword.node.js";
import { TypeScriptTypeCheckExpressionNode } from "./typescript-type-check-expression.node.js";

export class TypeScriptAsExpressionNode extends TypeScriptTypeCheckExpressionNode {
  public readonly asKeywordNode: TypeScriptAsKeywordNode;

  public constructor(
    expressionNode: Node,
    asKeywordNode: TypeScriptAsKeywordNode,
    span: SourceSpan,
    typeNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(expressionNode, span, typeNode, leadingTrivia, trailingTrivia);
    this.asKeywordNode = asKeywordNode;
  }
}
