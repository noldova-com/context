/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptDotNode } from "../delimiters/typescript-dot.node.js";

export class TypeScriptQualifiedNameNode extends Node {
  public readonly dotNode: TypeScriptDotNode;
  public readonly leftNode: Node;
  public readonly rightNode: Node;

  public constructor(leftNode: Node, dotNode: TypeScriptDotNode, rightNode: Node, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.leftNode = leftNode;
    this.dotNode = dotNode;
    this.rightNode = rightNode;
  }
}
