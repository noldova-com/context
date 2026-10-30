/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export class TypeScriptBinaryExpressionNode extends Node {
  public readonly leftNode: Node;
  public readonly operatorNode: Node;
  public readonly rightNode: Node;

  public constructor(
    leftNode: Node,
    operatorNode: Node,
    span: SourceSpan,
    rightNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.leftNode = leftNode;
    this.operatorNode = operatorNode;
    this.rightNode = rightNode;
  }
}
