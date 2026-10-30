/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptExclamationNode } from "../operators/typescript-exclamation.node.js";

export class TypeScriptNonNullExpressionNode extends Node {
  public readonly exclamationNode: TypeScriptExclamationNode;
  public readonly expressionNode: Node;

  public constructor(
    expressionNode: Node,
    exclamationNode: TypeScriptExclamationNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.exclamationNode = exclamationNode;
  }
}
