/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";

export class TypeScriptObjectLiteralExpressionNode extends TypeScriptDelimitedListNode {
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;
  public readonly openBraceNode: TypeScriptOpenBraceNode;

  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    propertyNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(propertyNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
  }
}
