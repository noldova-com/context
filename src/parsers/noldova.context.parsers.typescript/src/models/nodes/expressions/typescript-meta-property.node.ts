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

export class TypeScriptMetaPropertyNode extends Node {
  public readonly dotNode: TypeScriptDotNode;
  public readonly keywordNode: Node;
  public readonly nameNode: Node;

  public constructor(
    keywordNode: Node,
    span: SourceSpan,
    nameNode: Node,
    dotNode: TypeScriptDotNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.keywordNode = keywordNode;
    this.dotNode = dotNode;
    this.nameNode = nameNode;
  }
}
