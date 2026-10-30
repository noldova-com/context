/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptTypeArgumentListNode } from "./typescript-type-argument-list.node.js";

export class TypeScriptTypeReferenceNode extends Node {
  public readonly nameNode: Node;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  public constructor(
    nameNode: Node,
    span: SourceSpan,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.typeArgumentListNode = typeArgumentListNode;
  }
}
