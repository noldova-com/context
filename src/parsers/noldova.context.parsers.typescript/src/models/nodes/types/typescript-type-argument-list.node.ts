/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptGreaterThanNode } from "../operators/typescript-greater-than.node.js";
import type { TypeScriptLessThanNode } from "../operators/typescript-less-than.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";

export class TypeScriptTypeArgumentListNode extends TypeScriptDelimitedListNode {
  public readonly greaterThanNode: TypeScriptGreaterThanNode | undefined;
  public readonly lessThanNode: TypeScriptLessThanNode;

  public constructor(
    lessThanNode: TypeScriptLessThanNode,
    argumentNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    greaterThanNode?: TypeScriptGreaterThanNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(argumentNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.lessThanNode = lessThanNode;
    this.greaterThanNode = greaterThanNode;
  }
}
