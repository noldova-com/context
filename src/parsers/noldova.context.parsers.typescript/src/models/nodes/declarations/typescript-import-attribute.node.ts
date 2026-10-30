/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";

export class TypeScriptImportAttributeNode extends Node {
  public readonly nameNode: Node;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly valueNode: Node;

  public constructor(
    span: SourceSpan,
    nameNode: Node,
    valueNode: Node,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.colonNode = colonNode;
    this.valueNode = valueNode;
  }
}
