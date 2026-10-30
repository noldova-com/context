/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export class TypeScriptPrefixUnaryExpressionNode extends Node {
  public readonly operandNode: Node;
  public readonly operatorNode: Node;

  public constructor(
    operatorNode: Node,
    span: SourceSpan,
    operandNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.operatorNode = operatorNode;
    this.operandNode = operandNode;
  }
}
