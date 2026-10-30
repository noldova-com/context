/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptAtNode } from "../delimiters/typescript-at.node.js";

export class TypeScriptDecoratorNode extends Node {
  public readonly atNode: TypeScriptAtNode;
  public readonly expressionNode: Node;

  public constructor(
    atNode: TypeScriptAtNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.atNode = atNode;
    this.expressionNode = expressionNode;
  }
}
