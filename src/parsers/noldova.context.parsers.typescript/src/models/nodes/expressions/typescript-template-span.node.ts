/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export class TypeScriptTemplateSpanNode extends Node {
  public readonly expressionNode: Node;
  public readonly literalNode: Node | undefined;

  public constructor(
    expressionNode: Node,
    literalNode: Node | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.literalNode = literalNode;
  }
}
