/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBracketNode } from "../delimiters/typescript-close-bracket.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenBracketNode } from "../delimiters/typescript-open-bracket.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptParameterNode } from "./typescript-parameter.node.js";

export class TypeScriptIndexParameterListNode extends TypeScriptDelimitedListNode {
  public declare readonly children: readonly TypeScriptParameterNode[];
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  public constructor(
    openBracketNode: TypeScriptOpenBracketNode,
    parameterNodes: readonly TypeScriptParameterNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(parameterNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.openBracketNode = openBracketNode;
    this.closeBracketNode = closeBracketNode;
  }
}
