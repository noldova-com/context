/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptParameterNode } from "./typescript-parameter.node.js";

export class TypeScriptParameterListNode extends TypeScriptDelimitedListNode {
  public declare readonly children: readonly TypeScriptParameterNode[];
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;

  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    parameterNodes: readonly TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(parameterNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.openParenthesisNode = openParenthesisNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
