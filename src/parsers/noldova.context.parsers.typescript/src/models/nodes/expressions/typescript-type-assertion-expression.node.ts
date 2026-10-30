/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptGreaterThanNode } from "../operators/typescript-greater-than.node.js";
import type { TypeScriptLessThanNode } from "../operators/typescript-less-than.node.js";

export class TypeScriptTypeAssertionExpressionNode extends Node {
  public readonly expressionNode: Node;
  public readonly greaterThanNode: TypeScriptGreaterThanNode | undefined;
  public readonly lessThanNode: TypeScriptLessThanNode;
  public readonly typeNode: Node;

  public constructor(
    lessThanNode: TypeScriptLessThanNode,
    span: SourceSpan,
    typeNode: Node,
    expressionNode: Node,
    greaterThanNode?: TypeScriptGreaterThanNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.lessThanNode = lessThanNode;
    this.typeNode = typeNode;
    this.greaterThanNode = greaterThanNode;
    this.expressionNode = expressionNode;
  }
}
