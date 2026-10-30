/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptDotDotDotNode } from "../delimiters/typescript-dot-dot-dot.node.js";

export class TypeScriptSpreadElementNode extends Node {
  public readonly dotDotDotNode: TypeScriptDotDotDotNode;
  public readonly expressionNode: Node;

  public constructor(
    dotDotDotNode: TypeScriptDotDotDotNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.dotDotDotNode = dotDotDotNode;
    this.expressionNode = expressionNode;
  }
}
