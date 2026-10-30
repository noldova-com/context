/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export abstract class TypeScriptTypeCheckExpressionNode extends Node {
  public readonly expressionNode: Node;
  public readonly typeNode: Node;

  public constructor(expressionNode: Node, span: SourceSpan, typeNode: Node, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.typeNode = typeNode;
  }
}
